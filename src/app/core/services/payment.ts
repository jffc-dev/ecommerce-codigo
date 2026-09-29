import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { CULQI_3DS_SCRIPT, CULQI_CHECKOUT_SCRIPT, CULQI_PUBLIC_KEY } from '../config/culqi.config';
import { SUPABASE_FUNCTIONS_URL } from '../config/supabase.config';

const GENERIC_ERROR_MESSAGE = 'No pudimos procesar el pago. Intenta nuevamente en unos minutos.';

// ---- Tipos mínimos de las librerías globales de Culqi ----

interface CulqiCheckoutInstance {
  culqi: () => void;
  token: { id: string; email: string } | null;
  error: { user_message?: string; merchant_message?: string } | null;
  isOpen?: boolean;
  open(): void;
  close(): void;
}

type Parameters3DS = Record<string, string>;

interface Culqi3DSLib {
  publicKey: string;
  settings: { charge: { totalAmount: number; returnUrl: string }; card: { email: string } };
  options: Record<string, unknown>;
  generateDevice(): Promise<string | null>;
  initAuthentication(tokenId: string): void;
  reset(): void;
}

declare global {
  interface Window {
    CulqiCheckout?: new (publicKey: string, config: unknown) => CulqiCheckoutInstance;
    Culqi3DS?: Culqi3DSLib;
  }
}

type ChargeResult =
  | { status: 'paid'; charge_id: string }
  | { status: '3ds_required' }
  | { status: 'declined'; message: string };

interface ChargeRequest {
  order_id: string;
  token_id: string;
  device_finger_print_id: string | null;
  authentication_3DS?: Parameters3DS;
}

export interface PaymentRequest {
  orderId: string;
  email: string;
  /** Monto en céntimos, solo para mostrar en el modal. El cobro real lo calcula el servidor. */
  amountCents: number;
}

/** El cliente cerró el modal de Culqi o el de 3DS sin pagar: no es un error que haya que mostrar. */
export class PaymentCancelledError extends Error {
  constructor() {
    super('Pago cancelado');
  }
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly http = inject(HttpClient);
  private readonly scripts = new Map<string, Promise<void>>();

  /**
   * Cobra un pedido pendiente: abre Culqi Checkout (tarjeta / Yape), envía el token a la
   * Edge Function culqi-charge y, si Culqi lo pide, autentica con 3DS y reintenta.
   * Resuelve cuando el pedido quedó pagado; lanza Error con un mensaje para el cliente si no.
   */
  async pay({ orderId, email, amountCents }: PaymentRequest): Promise<void> {
    const culqi3DS = await this.load3DS();
    const deviceId = await culqi3DS.generateDevice().catch(() => null);

    const tokenId = await this.openCheckout(email, amountCents);
    const request: ChargeRequest = { order_id: orderId, token_id: tokenId, device_finger_print_id: deviceId };

    let result = await this.charge(request);
    if (result.status === '3ds_required') {
      const parameters3DS = await this.authenticate3DS(culqi3DS, tokenId, email, amountCents);
      result = await this.charge({ ...request, authentication_3DS: parameters3DS });
    }

    if (result.status === 'declined') {
      throw new Error(result.message);
    }
    if (result.status !== 'paid') {
      throw new Error(GENERIC_ERROR_MESSAGE);
    }
  }

  private async openCheckout(email: string, amountCents: number): Promise<string> {
    await this.loadScript(CULQI_CHECKOUT_SCRIPT);
    if (!window.CulqiCheckout) {
      throw new Error(GENERIC_ERROR_MESSAGE);
    }

    const culqi = new window.CulqiCheckout(CULQI_PUBLIC_KEY, {
      settings: { currency: 'PEN', amount: amountCents },
      client: { email },
      options: {
        lang: 'auto',
        installments: false,
        paymentMethods: {
          tarjeta: true,
          yape: true,
          billetera: false,
          bancaMovil: false,
          agente: false,
          cuotealo: false,
        },
      },
      appearance: {
        menuType: 'sidebar',
        buttonCardPayText: 'Pagar',
        defaultStyle: {
          bannerColor: '#111111',
          buttonBackground: '#111111',
          menuColor: '#111111',
          linksColor: '#111111',
          buttonTextColor: '#ffffff',
          priceColor: '#111111',
        },
      },
    });

    return new Promise<string>((resolve, reject) => {
      let settled = false;
      let wasOpen = false;

      const finish = (fn: () => void) => {
        settled = true;
        clearInterval(watcher);
        culqi.close();
        fn();
      };

      // Checkout Custom no avisa cuando el usuario cierra el modal: se detecta con isOpen
      const watcher = setInterval(() => {
        if (culqi.isOpen) {
          wasOpen = true;
        } else if (wasOpen && !settled) {
          finish(() => reject(new PaymentCancelledError()));
        }
      }, 500);

      culqi.culqi = () => {
        if (settled) return;
        if (culqi.token) {
          const tokenId = culqi.token.id;
          finish(() => resolve(tokenId));
        } else {
          console.error('Error de Culqi Checkout', culqi.error);
          finish(() => reject(new Error(culqi.error?.user_message ?? GENERIC_ERROR_MESSAGE)));
        }
      };

      culqi.open();
    });
  }

  private authenticate3DS(culqi3DS: Culqi3DSLib, tokenId: string, email: string, amountCents: number): Promise<Parameters3DS> {
    return new Promise<Parameters3DS>((resolve, reject) => {
      const done = (fn: () => void) => {
        window.removeEventListener('message', onMessage);
        culqi3DS.reset();
        fn();
      };

      const onMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        const { parameters3DS, error } = (event.data ?? {}) as { parameters3DS?: Parameters3DS; error?: string };
        if (parameters3DS) {
          done(() => resolve(parameters3DS));
        } else if (error) {
          console.error('Error de autenticación 3DS', error);
          done(() => reject(new Error('No se pudo autenticar tu tarjeta. Intenta nuevamente o usa otra tarjeta.')));
        }
      };

      window.addEventListener('message', onMessage);
      culqi3DS.options = {
        showModal: true,
        showLoading: true,
        showIcon: true,
        closeModalAction: () => done(() => reject(new PaymentCancelledError())),
        style: { btnColor: '#111111', btnTextColor: '#ffffff' },
      };
      culqi3DS.settings = {
        charge: { totalAmount: amountCents, returnUrl: window.location.href },
        card: { email },
      };
      culqi3DS.initAuthentication(tokenId);
    });
  }

  private charge(body: ChargeRequest): Promise<ChargeResult> {
    return firstValueFrom(this.http.post<ChargeResult>(`${SUPABASE_FUNCTIONS_URL}/culqi-charge`, body)).catch(
      (error: HttpErrorResponse) => {
        // La Edge Function devuelve { message } pensado para el cliente en sus errores 4xx/5xx
        console.error('Error al cobrar el pedido', error);
        throw new Error(error.error?.message ?? GENERIC_ERROR_MESSAGE);
      },
    );
  }

  private async load3DS(): Promise<Culqi3DSLib> {
    await this.loadScript(CULQI_3DS_SCRIPT);
    if (!window.Culqi3DS) {
      throw new Error(GENERIC_ERROR_MESSAGE);
    }
    window.Culqi3DS.publicKey = CULQI_PUBLIC_KEY;
    return window.Culqi3DS;
  }

  /** Carga un script externo una sola vez (las librerías de Culqi solo se necesitan en el checkout). */
  private loadScript(src: string): Promise<void> {
    let loading = this.scripts.get(src);
    if (!loading) {
      loading = new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => {
          this.scripts.delete(src);
          reject(new Error('No pudimos cargar la pasarela de pago. Revisa tu conexión e intenta nuevamente.'));
        };
        document.body.appendChild(script);
      });
      this.scripts.set(src, loading);
    }
    return loading;
  }
}

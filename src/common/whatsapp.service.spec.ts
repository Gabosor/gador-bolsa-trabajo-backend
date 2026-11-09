import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WhatsappService } from './whatsapp.service';

// @nestjs/config se publica como ESM y Jest no lo carga en CommonJS.
jest.mock('@nestjs/config', () => ({ ConfigService: class {} }));

const entorno: Record<string, string> = {
  EVOLUTION_API_URL: 'https://evo.test/',
  EVOLUTION_API_KEY: 'clave',
  EVOLUTION_INSTANCE: 'gador',
};

const crear = (valores = entorno) =>
  new WhatsappService({
    get: (clave: string) => valores[clave],
  } as unknown as ConfigService);

describe('WhatsappService', () => {
  const fetchSimulado = jest.fn();

  beforeEach(() => {
    fetchSimulado.mockReset();
    global.fetch = fetchSimulado;
    jest.spyOn(console, 'error').mockImplementation();
  });

  it('envía al número con el código de Bolivia', async () => {
    fetchSimulado.mockResolvedValue(new Response('{}', { status: 201 }));
    await crear().enviar('71234567', 'hola');

    const [url, opciones] = fetchSimulado.mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toBe('https://evo.test/message/sendText/gador');
    expect(opciones.headers).toMatchObject({ apikey: 'clave' });
    expect(JSON.parse(opciones.body as string)).toEqual({
      number: '59171234567',
      text: 'hola',
    });
  });

  it('avisa si el número no tiene WhatsApp', async () => {
    fetchSimulado.mockResolvedValue(
      new Response('{"response":{"message":[{"exists":false}]}}', {
        status: 400,
      }),
    );
    await expect(crear().enviar('71234567', 'x')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('no culpa al número por otro error 400', async () => {
    fetchSimulado.mockResolvedValue(new Response('{}', { status: 400 }));
    await expect(crear().enviar('71234567', 'x')).rejects.toThrow(
      ServiceUnavailableException,
    );
  });

  it('informa servicio no disponible si la red falla', async () => {
    fetchSimulado.mockRejectedValue(new Error('timeout'));
    await expect(crear().enviar('71234567', 'x')).rejects.toThrow(
      ServiceUnavailableException,
    );
  });

  it('no llama a la red si falta configuración', async () => {
    await expect(crear({}).enviar('71234567', 'x')).rejects.toThrow(
      ServiceUnavailableException,
    );
    expect(fetchSimulado).not.toHaveBeenCalled();
  });
});

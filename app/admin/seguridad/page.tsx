import React from 'react';
import { SecurityClient } from './SecurityClient';

export const metadata = {
  title: 'Seguridad & Autenticación 2FA | Admin GUTA MÚSICA',
  description: 'Configuración de llaves Passkey (Windows Hello, PIN) y 2FA TOTP (Oracle Authenticator)',
};

export default function SecurityPage() {
  return <SecurityClient />;
}

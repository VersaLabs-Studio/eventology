// ============================================================================
// TicketQR — render an HMAC-signed qr_data payload as a QR code
// ============================================================================
// The qr_data is the server-signed EVT-{ticketId}-{registrationId}-{hmac}
// payload. The organizer scanner (web A2) verifies it on the server.
// This component is a pure render — no validation, no DB call.
// ============================================================================

import React from 'react';
import { StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useColorScheme } from 'react-native';
import { colors } from '@/lib/theme';

interface TicketQRProps {
  value: string;
  size?: number;
}

export function TicketQR({ value, size = 220 }: TicketQRProps): React.ReactElement {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const bg = isDark ? colors.surfaceDark : '#FFFFFF';
  const fg = isDark ? '#E5E7EB' : '#0F172A';

  return (
    <View style={[styles.wrap, { backgroundColor: bg, borderColor: isDark ? colors.borderDark : colors.border }]}>
      <QRCode
        value={value}
        size={size}
        backgroundColor={bg}
        color={fg}
        ecl="M"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Defs, RadialGradient, Rect, Stop, Svg } from 'react-native-svg';
import { BadgeCheckIcon, UserRoundPenIcon } from 'lucide-react-native';

import { Spinner } from '~/components/spinner';

export default function Home() {
  return (
    <View style={styles.body}>
      <View style={StyleSheet.absoluteFill}>
        <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient id="blob1" cx="25%" cy="10%" r="60%">
              <Stop offset="0" stopColor="#8b5cf6" stopOpacity="0.3" />
              <Stop offset="1" stopColor="#8b5cf6" stopOpacity="0" />
            </RadialGradient>

            <RadialGradient id="blob2" cx="80%" cy="30%" r="70%">
              <Stop offset="0" stopColor="#3b82f6" stopOpacity="0.2" />
              <Stop offset="1" stopColor="#3b82f6" stopOpacity="0" />
            </RadialGradient>
          </Defs>

          <Rect x="0" y="0" width="100%" height="100%" fill="url(#blob1)" />
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#blob2)" />
        </Svg>
      </View>

      <View style={styles.container}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>P</Text>
        </View>

        <View style={styles.username}>
          <Text style={styles.usernameText}>Piotr Lesiak</Text>
          <BadgeCheckIcon fill="#f4ec22" size={28} style={{ marginTop: 2 }} />
        </View>

        <View style={styles.mainContent}>
          <Text style={styles.inputLabel}>Customize Your Profile Name</Text>

          <View style={styles.inputWrapper}>
            <UserRoundPenIcon
              color="#94a3b8"
              size={20}
              style={styles.inputIconLeft}
            />

            <TextInput
              value="Piotr Lesiak"
              placeholder="Enter your name"
              placeholderTextColor="#475569"
              autoCorrect={false}
              style={styles.input}
            />

            <Spinner style={styles.inputIconRight} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },

  container: {
    flex: 1,
    zIndex: 1,
    position: 'relative',
    marginTop: 180,
    borderRadius: 38,
    backgroundColor: '#2f2f2f',
  },

  avatar: {
    width: 82,
    height: 82,
    position: 'absolute',
    top: -41,
    left: '50%',
    transform: [{ translateX: '-50%' }],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    borderColor: '#000000',
    borderWidth: 1.5,
    backgroundColor: '#ef6c00',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: '500',
  },

  username: {
    marginTop: 60,
    marginInline: 'auto',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  usernameText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '600',
  },

  mainContent: {
    flex: 1,
    paddingTop: 48,
    paddingInline: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#cbd5e1',
    marginBottom: 12,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIconLeft: {
    marginRight: 12,
  },
  inputIconRight: {
    marginLeft: 12,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    height: '100%',
  },
});

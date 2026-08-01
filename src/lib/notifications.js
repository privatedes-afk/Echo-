import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleCapsuleNotification(unlockDate, capsuleId) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'A time capsule just unlocked ✨',
      body: 'A message from your past self is ready to read.',
      data: { capsuleId },
    },
    trigger: unlockDate,
  });
}

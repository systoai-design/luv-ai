import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, Check } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export const NotificationSettings = () => {
  const { isSupported, isSubscribed, permission, subscribe, unsubscribe } = usePushNotifications();

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Get notified about matches, messages, and calls
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 text-muted-foreground">
            <BellOff className="h-5 w-5" />
            <p>Push notifications are not supported in this browser</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push Notifications
        </CardTitle>
        <CardDescription>
          Get real-time notifications even when the app is closed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="font-medium">Browser Notifications</p>
            <p className="text-sm text-muted-foreground">
              {isSubscribed
                ? 'You will receive push notifications'
                : 'Enable to receive push notifications'}
            </p>
          </div>
          <Badge variant={isSubscribed ? 'default' : 'secondary'}>
            {isSubscribed ? (
              <>
                <Check className="h-3 w-3 mr-1" />
                Enabled
              </>
            ) : (
              'Disabled'
            )}
          </Badge>
        </div>

        {permission === 'denied' && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">
              Notification permission was denied. Please enable notifications in your browser settings.
            </p>
          </div>
        )}

        <div className="flex gap-2">
          {!isSubscribed ? (
            <Button onClick={subscribe} className="w-full">
              <Bell className="h-4 w-4 mr-2" />
              Enable Notifications
            </Button>
          ) : (
            <Button onClick={unsubscribe} variant="outline" className="w-full">
              <BellOff className="h-4 w-4 mr-2" />
              Disable Notifications
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>You'll be notified about:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>New matches</li>
            <li>Incoming messages</li>
            <li>Video call requests</li>
            <li>System updates</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
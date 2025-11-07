import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";

const Messages = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl lg:pl-64 xl:pr-80">
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-primary" />
            Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No Messages Yet</h3>
            <p className="text-muted-foreground">
              Start a conversation with your friends or AI companions
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Messages;

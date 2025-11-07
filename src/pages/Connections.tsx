import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";
import Discover from "./Discover";
import LikesReceived from "./LikesReceived";
import LikesSent from "./LikesSent";
import Matches from "./Matches";

export default function Connections() {
  const { unreadLikes } = useUnreadCounts();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Connections</h1>
      
      <Tabs defaultValue="discover" className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-4 mb-6">
          <TabsTrigger value="discover">Discover</TabsTrigger>
          <TabsTrigger value="likes-received" className="relative">
            Likes You
            {unreadLikes > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 px-1.5">
                {unreadLikes}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="likes-sent">Your Likes</TabsTrigger>
          <TabsTrigger value="matches">Matches</TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="animate-enter">
          <Discover />
        </TabsContent>
        
        <TabsContent value="likes-received" className="animate-enter">
          <LikesReceived />
        </TabsContent>
        
        <TabsContent value="likes-sent" className="animate-enter">
          <LikesSent />
        </TabsContent>
        
        <TabsContent value="matches" className="animate-enter">
          <Matches />
        </TabsContent>
      </Tabs>
    </div>
  );
}

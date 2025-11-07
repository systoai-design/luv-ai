import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface ProfileTabsProps {
  postsContent: React.ReactNode;
  aboutContent: React.ReactNode;
  activeTab?: string;
  onTabChange?: (tab: "posts" | "about") => void;
}

export const ProfileTabs = ({ postsContent, aboutContent, activeTab, onTabChange }: ProfileTabsProps) => {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange as any} defaultValue="posts" className="w-full">
      <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
        <TabsTrigger 
          value="posts" 
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
        >
          Posts
        </TabsTrigger>
        <TabsTrigger 
          value="about"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
        >
          About
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="posts" className="mt-6">
        {postsContent}
      </TabsContent>
      
      <TabsContent value="about" className="mt-6">
        {aboutContent}
      </TabsContent>
    </Tabs>
  );
};

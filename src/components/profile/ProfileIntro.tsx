import { Card } from "@/components/ui/card";
import { Mail, Wallet } from "lucide-react";

interface ProfileIntroProps {
  bio?: string;
  email?: string;
  walletAddress?: string;
}

export const ProfileIntro = ({ bio, email, walletAddress }: ProfileIntroProps) => {
  return (
    <Card className="p-6 bg-card border-border">
      <h2 className="text-xl font-bold mb-4">Intro</h2>
      
      {bio && (
        <p className="text-foreground mb-4">{bio}</p>
      )}
      
      <div className="space-y-3">
        {email && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>{email}</span>
          </div>
        )}
        
        {walletAddress && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Wallet className="h-4 w-4" />
            <span className="truncate">{walletAddress}</span>
          </div>
        )}
      </div>
    </Card>
  );
};

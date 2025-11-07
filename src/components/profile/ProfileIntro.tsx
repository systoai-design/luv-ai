import { Card } from "@/components/ui/card";
import { Mail, Wallet, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatWalletAddress } from "@/lib/utils";
import { toast } from "sonner";
import { useState } from "react";

interface ProfileIntroProps {
  bio?: string;
  email?: string;
  walletAddress?: string;
  interests?: string[];
}

export const ProfileIntro = ({ bio, email, walletAddress, interests }: ProfileIntroProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopyWallet = async () => {
    if (!walletAddress) return;
    
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      toast.success("Wallet address copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy address");
    }
  };

  return (
    <Card className="p-6 bg-card border-border">
      <h2 className="text-xl font-bold mb-4">Intro</h2>
      
      {bio ? (
        <p className="text-foreground mb-4 leading-relaxed">{bio}</p>
      ) : (
        <p className="text-muted-foreground mb-4 italic text-sm">No bio added yet</p>
      )}
      
      <div className="space-y-3">
        {email && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Mail className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{email}</span>
          </div>
        )}
        
        {walletAddress && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wallet className="h-4 w-4 flex-shrink-0" />
            <span className="font-mono" title={walletAddress}>
              {formatWalletAddress(walletAddress)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 flex-shrink-0"
              onClick={handleCopyWallet}
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
        )}

        {interests && interests.length > 0 && (
          <div className="pt-3 border-t border-border">
            <p className="text-sm font-medium mb-2">Interests</p>
            <div className="flex flex-wrap gap-2">
              {interests.map((interest) => (
                <Badge key={interest} variant="secondary" className="text-xs">
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

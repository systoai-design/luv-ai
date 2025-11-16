import { useState } from 'react';
import { MoreVertical, Flag, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ReportDialog } from './ReportDialog';
import { BlockDialog } from './BlockDialog';

interface BlockReportMenuProps {
  userId: string;
  username: string;
}

export const BlockReportMenu = ({ userId, username }: BlockReportMenuProps) => {
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setShowBlockDialog(true)}>
            <Ban className="mr-2 h-4 w-4" />
            Block User
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowReportDialog(true)}>
            <Flag className="mr-2 h-4 w-4" />
            Report User
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ReportDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        userId={userId}
        username={username}
      />

      <BlockDialog
        open={showBlockDialog}
        onOpenChange={setShowBlockDialog}
        userId={userId}
        username={username}
      />
    </>
  );
};

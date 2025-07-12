import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CreateDVDialog } from '@/components/CreateDVDialog';
import { DVList } from '@/components/DVList';

const DisbursementVouchers = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Disbursement Vouchers</h1>
            <p className="text-muted-foreground">
              Manage payment vouchers for accepted inspection reports
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create DV
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Disbursement Vouchers</CardTitle>
          </CardHeader>
          <CardContent>
            <DVList />
          </CardContent>
        </Card>

        <CreateDVDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        />
      </div>
    </Layout>
  );
};

export default DisbursementVouchers;
export interface VarianceInfo {
  variance: number;
  variancePercentage: number;
  status: string;
  color: string;
}

export interface PPMPItemWithExecution {
  total_cost: number;
  pr_actual_amount?: number | null;
  po_actual_amount?: number | null;
  dv_actual_amount?: number | null;
}

export function calculateVarianceInfo(item: PPMPItemWithExecution): VarianceInfo {
  const plannedAmount = item.total_cost;
  const actualAmount = item.dv_actual_amount || item.po_actual_amount || item.pr_actual_amount || 0;
  
  if (actualAmount === 0) {
    return {
      variance: 0,
      variancePercentage: 0,
      status: 'No actual data',
      color: 'text-muted-foreground'
    };
  }
  
  const variance = plannedAmount - actualAmount;
  const variancePercentage = (variance / plannedAmount) * 100;
  
  return {
    variance,
    variancePercentage,
    status: variance > 0 ? 'Savings' : variance < 0 ? 'Overrun' : 'On Budget',
    color: variance > 0 ? 'text-green-600' : variance < 0 ? 'text-red-600' : 'text-blue-600'
  };
}

export function getExecutionStatusBadge(status?: string) {
  switch (status) {
    case 'planned':
      return { label: 'Planned', variant: 'secondary' as const };
    case 'pr_submitted':
      return { label: 'PR Submitted', variant: 'default' as const };
    case 'po_issued':
      return { label: 'PO Issued', variant: 'default' as const };
    case 'completed':
      return { label: 'Completed', variant: 'default' as const };
    default:
      return { label: 'Planned', variant: 'secondary' as const };
  }
}

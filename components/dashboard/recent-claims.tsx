 "use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

interface Claim {
  id: string;
  patientName: string;
  amount: number;
  status: "PENDING" | "APPROVED" | "DENIED";
  timestamp: Date;
}

interface RecentClaimsProps {
  claims: Claim[];
}

export function RecentClaims({ claims }: RecentClaimsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Claims</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {claims.map((claim) => (
            <div key={claim.id} className="flex items-center">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  {claim.patientName}
                </p>
                <p className="text-sm text-muted-foreground">
                  ${claim.amount.toFixed(2)}
                </p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <div className={`text-sm ${
                  claim.status === "APPROVED"
                    ? "text-green-600"
                    : claim.status === "DENIED"
                    ? "text-red-600"
                    : "text-yellow-600"
                }`}>
                  {claim.status}
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatDate(claim.timestamp)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
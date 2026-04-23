import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings as SettingsIcon, User, Mail, Shield, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 text-primary rounded-lg">
          <SettingsIcon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences and integrations.</p>
        </div>
      </div>

      <div className="grid gap-6 max-w-4xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              <CardTitle>Profile Information</CardTitle>
            </div>
            <CardDescription>Your public identity on the platform.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Full Name</p>
                <p className="font-medium">{user?.firstName} {user?.lastName || "N/A"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase">User ID</p>
                <p className="font-mono text-[10px] text-muted-foreground">{userId}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" />
              <CardTitle>Email Addresses</CardTitle>
            </div>
            <CardDescription>The primary email used for notifications and reports.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{user?.emailAddresses[0].emailAddress}</p>
                  <p className="text-xs text-emerald-500 font-medium">Verified Primary Email</p>
                </div>
                <Button variant="outline" size="sm">Change</Button>
             </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <CardTitle>API & Security</CardTitle>
            </div>
            <CardDescription>Manage your personal access tokens for CLI usage.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-muted/50 rounded-lg border border-dashed text-center">
              <p className="text-sm text-muted-foreground">Personal Access Tokens (PATs) are coming soon.</p>
            </div>
          </CardContent>
        </Card>

         <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>Irreversible actions for your account.</CardDescription>
          </CardHeader>
          <CardContent>
             <Button variant="destructive">Delete Account</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { createServerSupabaseClient } from "@/lib/supabase-server"
import { getProfile } from "@/lib/services/profile-service"
import { ProfileForm } from "@/components/profile/profile-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default async function ProfilePage() {
  const supabase = createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  let profile = null
  if (session?.user) {
    profile = await getProfile(session.user.id)
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-10">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Manage your account settings and profile information</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm initialData={profile} />
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}

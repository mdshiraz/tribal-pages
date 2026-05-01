import { Switch, Route, Redirect } from 'wouter'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import Layout from '@/components/layout/Layout'
import Login from '@/pages/Login'
import Home from '@/pages/Home'
import FamilyView from '@/pages/FamilyView'
import NamesView from '@/pages/NamesView'
import TreeView from '@/pages/TreeView'
import AncestorsView from '@/pages/AncestorsView'
import DescendantsView from '@/pages/DescendantsView'
import KinView from '@/pages/KinView'
import ReportsView from '@/pages/ReportsView'
import PrintableView from '@/pages/PrintableView'
import PersonEdit from '@/pages/PersonEdit'
import GedcomImport from '@/pages/GedcomImport'

function ProtectedRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    )
  }

  if (!user) return <Redirect to="/login" />

  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/view/family" component={FamilyView} />
        <Route path="/view/family/:personId" component={FamilyView} />
        <Route path="/view/names" component={NamesView} />
        <Route path="/view/tree" component={TreeView} />
        <Route path="/view/ancestors" component={AncestorsView} />
        <Route path="/view/ancestors/:personId" component={AncestorsView} />
        <Route path="/view/descendants" component={DescendantsView} />
        <Route path="/view/descendants/:personId" component={DescendantsView} />
        <Route path="/view/kin" component={KinView} />
        <Route path="/view/reports" component={ReportsView} />
        <Route path="/view/printable" component={PrintableView} />
        <Route path="/person/:personId/edit" component={PersonEdit} />
        <Route path="/tools/import" component={GedcomImport} />
        <Route>
          <Redirect to="/" />
        </Route>
      </Switch>
    </Layout>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Switch>
        <Route path="/login" component={Login} />
        <Route component={ProtectedRoutes} />
      </Switch>
    </AuthProvider>
  )
}

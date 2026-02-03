import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <div className="container">
          <p>🇪🇸 Spanish Buddy — Learn Spanish the fun way!</p>
        </div>
      </footer>
    </div>
  );
}

import MeteorLoader from "./MeteorLoader";

interface LoadingPageProps {
  message?: string;
  fullScreen?: boolean;
}

export default function LoadingPage({ message = "Loading...", fullScreen = true }: LoadingPageProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-6 ${fullScreen ? 'min-h-screen' : 'min-h-[400px]'} bg-background`}>
      <MeteorLoader size="lg" />
      {message && (
        <p className="text-lg text-muted-foreground font-serif italic" data-testid="text-loading-message">
          {message}
        </p>
      )}
    </div>
  );
}

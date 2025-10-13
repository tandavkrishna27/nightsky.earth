import MeteorLoader from "./MeteorLoader";

interface LoadingPageProps {
  message?: string;
  fullScreen?: boolean;
}

export default function LoadingPage({ message = "Loading...", fullScreen = true }: LoadingPageProps) {
  return (
    <div className={`flex flex-col items-center justify-center ${fullScreen ? 'min-h-screen' : 'min-h-[400px]'} bg-background`}>
      <MeteorLoader size="lg" />
    </div>
  );
}

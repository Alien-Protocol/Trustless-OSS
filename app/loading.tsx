import LoadingLogo from './components/layout/LoadingLogo';

export default function RootLoading() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <LoadingLogo message="Loading" size="lg" />
    </div>
  );
}

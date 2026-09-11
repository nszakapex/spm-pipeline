export default function AppLoading() {
  return (
    <div className="space-y-5" aria-busy="true" aria-live="polite">
      <div className="h-9 w-40 rounded-md bg-[#e8eef6]" />
      <div className="h-4 w-72 max-w-full rounded-md bg-[#eef2f7]" />
      <div className="spm-panel h-64 bg-[#f7f9fc]" />
    </div>
  );
}
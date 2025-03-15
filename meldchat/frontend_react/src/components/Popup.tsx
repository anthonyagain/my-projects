export function Popup({ children }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      {children}
    </div>
  );
}

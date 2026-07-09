export default function Stub({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="px-4 pt-6">
      <h1 className="text-xl font-bold text-gray-900 mb-2">{title}</h1>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center mt-4">
        <div className="text-4xl mb-3">🚧</div>
        <p className="text-gray-500 text-sm">{desc}</p>
      </div>
    </div>
  );
}

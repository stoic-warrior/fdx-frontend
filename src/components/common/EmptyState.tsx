const EmptyState = ({ message }: { message: string }) => {
  return (
    <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-10 text-sm text-slate-500">
      {message}
    </div>
  );
};

export default EmptyState;

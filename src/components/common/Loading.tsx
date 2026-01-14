const Loading = ({ label = "데이터를 불러오는 중..." }: { label?: string }) => {
  return (
    <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-10 text-sm text-slate-500">
      {label}
    </div>
  );
};

export default Loading;

const NoBlogs = ({}) => {
  return (
    <div className="py-4">
      <img
        className="mx-auto mt-6 pointer-events-none"
        src="/images/not_found.avif"
        alt="no blogs found"
      />
      <h2 className="text-center">No blogs found</h2>
    </div>
  );
};

export default NoBlogs;

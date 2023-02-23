import { useContext } from "react";
import { KeysContext } from "./context/keys-provider";
import WriteButton from "./WriteButton";

interface NoBlogsProps {
  profilePublicKey?: string;
}

const NoBlogs = ({ profilePublicKey }: NoBlogsProps) => {
  //@ts-ignore
  const { keys } = useContext(KeysContext);

  return (
    <div className="py-4">
      <img
        className="mx-auto mt-6 pointer-events-none"
        src="/images/not_found.avif"
        alt="no blogs found"
      />
      <h2 className="text-center">No blogs found</h2>
      {profilePublicKey &&
      keys.publicKey &&
      profilePublicKey === keys.publicKey ? (
        <div className="flex justify-center items-center gap-4 text-gray mt-4">
          <span>click</span>
          <WriteButton />
          <span>to start blogging</span>
        </div>
      ) : null}
    </div>
  );
};

export default NoBlogs;

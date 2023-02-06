import Following from "./Following";
import UserCard from "./UserCard";

const Profile = ({ npub }: any) => {
  return (
    <>
      <UserCard npub={npub} />
      <Following npub={npub} />
    </>
  );
};

export default Profile;

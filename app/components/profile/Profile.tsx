import UserCard from "./UserCard";

const Profile = ({ npub }: any) => {

  return (
    <>
      <UserCard npub={npub} />
      {/* {profileContactList && ( */}
      {/*   <Contacts npub={npub} userContacts={profileContactList} /> */}
      {/* )} */}
    </>
  );
};

export default Profile;

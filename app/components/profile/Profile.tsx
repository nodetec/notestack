import UserCard from "./UserCard";

const Profile = ({ npub }: any) => {
  // handle case where profile is loggedin user
  // useEffect(() => {
  //   if (!activeRelay) return;
  //   if (!user) return;
  //   let relayUrl = activeRelay.url.replace("wss://", "");
  //   const cachedUser = user[`user_${relayUrl}`];
  //   console.log("FROM PROFILE: cachedUser", cachedUser);
  //   const profilePubkey = nip19.decode(npub).data.valueOf();
  //   if (!cachedUser) return;
  //   if (profilePubkey !== cachedUser.pubkey) {
  //     const contentObj = JSON.parse(cachedUser.content);
  //     setLoggedInUser(cachedUser);
  //     setProfile(contentObj)
  //   }

  //   // setLoggedInPubkey(user[`user_${relayUrl}`].pubkey);
  // }, [user, activeRelay]);

  // handle case where profile is not loggedin user

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

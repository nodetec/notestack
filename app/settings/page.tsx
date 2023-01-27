"use client";

import Aside from "../Aside";
import Main from "../Main";

const SettingsPage = () => {
  return (
    <Main>
      <div className="pt-8">
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>
      <Aside>
        <h3 className="font-bold text-lg">Lorem ipsum dolor sit amet.</h3>
        <ul>
          <li>Lorem, ipsum dolor.</li>
          <li>Lorem, ipsum dolor.</li>
          <li>Lorem, ipsum dolor.</li>
        </ul>
      </Aside>
    </Main>
  );
};

export default SettingsPage;

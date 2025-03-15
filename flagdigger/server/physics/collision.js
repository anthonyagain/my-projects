import { handleFieldContact } from './experience.js';

export const handlePlayerContact = (player) => {
  // This gets called on each world-step so keep this function efficient
  // TODO: Use this function instead of `collisionChange` in world.js, 
  // or move `collisionChange` function to be a method inside this file
  const contactList = player.getContactList();
  if(!contactList) return;
  // NOTE: we're missing contacts because we're using `contactList` method in worldstep
  // Which as described by https://box2d.org/documentation/classb2_body.html#ad20334ee2027b51c81d40614d62b6114
  // Is bad practice, we should use 'pre-solve'/'post-solve', but sensor collisions
  // Aren't registered in pre/post-solve, so gg
  
  const touchingBody = contactList.other;
  const fixtureList = touchingBody.getFixtureList();
  if(!fixtureList) return;
  
  for (const fixture of fixtureList) {
    const fixtureData = fixture.custUserData;
    if(fixtureData.gameType === 'ORB_FIELD') handleFieldContact(player, fixture);
  };

}
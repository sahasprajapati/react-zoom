export function randomID(len: number): string {
  let result = "";
  if (result) return result;
  var chars = "12345qwertyuiopasdfgh67890jklmnbvcxzMNBVCZXASDQWERTYHGFUIOLKJP",
    maxPos = chars.length,
    i;
  len = len || 5;
  for (i = 0; i < len; i++) {
    result += chars.charAt(Math.floor(Math.random() * maxPos));
  }
  return result;
}
export function randomNumID(len: number): string {
  len = len || 5;
  var r = Math.floor(Math.random() * Math.pow(10, len)).toString();
  if (r.length < len) {
    r = randomNumID(len);
  }
  return r;
}
export function getRandomName() {
  const names = [
    "Oliver",
    "Jake",
    "Noah",
    "James",
    "Jack",
    "Connor",
    "Liam",
    "John",
    "Harry",
    "Callum",
    "Mason",
    "Robert",
    "Jacob",
    "Jacob",
    "Jacob",
    "Michael",
    "Charlie",
    "Kyle",
    "William",
    "William",
    "Thomas",
    "Joe",
    "Ethan",
    "David",
    "George",
    "Reece",
    "Michael",
    "Richard",
    "Oscar",
    "Rhys",
    "Alexander",
    "Joseph",
    "James",
    "Charlie",
    "James",
    "Charles",
    "William",
    "Damian",
    "Daniel",
    "Thomas",
  ];
  let index = Math.round(Math.random() * names.length);
  index = index === names.length ? index - 1 : index;
  return names[index];
}
export function generateTokenForCallInvitation(
  userID: string,
  roomID: string,
  userName: string
): Promise<{ token: string }> {
  console.log("generateToken:", process.env);
  return fetch(
    `https://nextjs-token-callinvitation.vercel.app/api/access_token?userID=${userID}&expired_ts=86400`,
    {
      method: "GET",
    }
  )
    .then((res) => res.json())
    .then((result) => {
      return {
        token:
          result.token +
          "#" +
          window.btoa(
            JSON.stringify({
              userID,
              roomID,
              userName: encodeURIComponent(userName),
              appID: 252984006,
            })
          ),
      };
    });
}

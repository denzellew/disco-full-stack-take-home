import * as React from "react";
import { Box, CircularProgress } from "@mui/material";

import { ProfileView } from "./ProfileView";
import { ProfileLoader } from "./ProfileLoader";
import { ApiService } from "../../utils/ApiService";
import { Profile } from "../../types";

export const ProfilesList: React.FC = (props) => {
  const [loading, setLoading] = React.useState(true);
  const [dids, setDids] = React.useState<string[]>([]);

  const api = React.useMemo(() => new ApiService(), []);

  React.useEffect(() => {
    async function fetchProfiles() {
      const dtoDids = await api.getAllDids();
      setDids(dtoDids);
      setLoading(false);
    };

    fetchProfiles();
  }, [api]);
  // @NOTE: Example api usage:
  // console.log(await api.getProfileViaDid("did:3:kjzl6cwe1jw148uyox3goiyrwwe3aab8vatm3apxqisd351ww0dj6v5e3f61e8b"));

  // throw new Error(
  //   "@TODO: Please implement me using ApiService and ProfileView or ProfileLoader! This component should display all of the profiles one after the other.",
  // );

  if (loading) {
    return (
      <Box sx={{ alignItems: "center", display: "flex", justifyContent: "center", padding: "50px 0", width: "100%" }}>
        <CircularProgress />
      </Box>
    );
  }

  return dids.map(did => (<ProfileLoader did={did}></ProfileLoader>));
};

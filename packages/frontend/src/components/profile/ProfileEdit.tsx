import * as React from "react";
import { Profile } from "../../types";
import { CeramicContext } from "../../contexts/";
import { Box, Button, FormControl, TextField, Typography, CircularProgress } from "@mui/material";
import { DidView } from "../DidView";
import { ApiService } from "../../utils";

export interface ProfileEditProps {
  onSaveComplete?(): void;
}

export const ProfileEdit: React.FC<ProfileEditProps> = (props) => {
  const { ensureConnected, userDid, userData, updateUserData, isConnected, isLoadingUserData } =
    React.useContext(CeramicContext);
  ensureConnected();
  const [loading, setLoading] = React.useState(false);
  const [profile, setProfile] = React.useState<Profile>({});
  const api = React.useMemo(() => new ApiService(), []);
  
  React.useEffect(() => {
    setProfile(userData.profile || {});
  }, [userData]);

  async function saveProfile() {
    setLoading(true);
    await updateUserData({ profile });
    await api.registerDid(userDid);
    setLoading(false);
    props.onSaveComplete && props.onSaveComplete();
    console.log("[ProfileEdit] Successfully updated user data for DID", userDid);
  }

  if (isLoadingUserData) {
    return (
      <Box sx={{ alignItems: "center", display: "flex", justifyContent: "center", padding: "50px 0", width: "100%" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h4">Edit Profile</Typography>
        <DidView did={userDid} typographyVariant="body2" copy dontTruncate />
      </Box>

      <FormControl fullWidth sx={{ marginBottom: 3 }}>
        <Typography variant="h6">Add a profile image</Typography>
        <Typography variant="body2" sx={{ marginBottom: 1 }}>
          Recommended size: 400x400px. 1MB max size. JPG, PNG, or GIF.
        </Typography>
        {profile.avatar && (
          <Box mb={1}>
            <img src={profile.avatar} alt="avatar" style={{ width: "100%", height: "auto", maxWidth: "200px" }} />
          </Box>
        )}
        <Typography variant="body2" sx={{ marginBottom: 1, marginTop: 1 }}>
          Profile image URL
        </Typography>
        <TextField
          variant="outlined"
          type="text"
          disabled={isLoadingUserData}
          value={profile.avatar || ""}
          onChange={(e) => setProfile({ ...profile, avatar: e.target.value })}
        />
      </FormControl>

      <FormControl fullWidth sx={{ marginBottom: 3 }}>
        <Typography variant="h6">Enter Display Name</Typography>
        <TextField
          variant="outlined"
          type="text"
          disabled={isLoadingUserData}
          value={profile.name || ""}
          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
        />
      </FormControl>

      <FormControl fullWidth sx={{ marginBottom: 3 }}>
        <Typography variant="h6">Write a short bio</Typography>
        <Typography variant="body2">Please limit to 200 characters.</Typography>
        <TextField
          disabled={isLoadingUserData}
          inputProps={{ maxLength: 200 }}
          minRows={3}
          multiline
          variant="outlined"
          value={profile.bio || ""}
          onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
        />
      </FormControl>

      <Box>
        <Button onClick={saveProfile} disabled={loading || !isConnected} variant="contained">
          {loading ? <CircularProgress size="20px" /> : "Save Profile"}
        </Button>
      </Box>
    </Box>
  );
};

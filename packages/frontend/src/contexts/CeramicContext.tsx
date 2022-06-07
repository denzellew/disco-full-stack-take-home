import * as React from "react";
import { ThreeIdConnect, EthereumAuthProvider } from "@3id/connect";
import { CeramicClient } from "@ceramicnetwork/http-client";
import ThreeIdResolver from "@ceramicnetwork/3id-did-resolver";
import { DID } from "dids";
import { TileDocument, TileMetadataArgs } from "@ceramicnetwork/stream-tile";

import { UserData, VC } from "../types";

export const DEFAULT_TILE_METADATA = {
  family: "userData",
  // tags: ['tag1'],
};
const API_URL = "https://ceramic-clay.3boxlabs.com";
// const API_URL = 'http://143.244.210.5:7007'; // disco node

export interface CeramicContextInterface {
  isConnected: boolean;
  isLoadingUserData: boolean;
  ethAddress?: string;
  userDid?: string;
  userData: UserData;
  ensureConnected(): Promise<void>;
  updateUserData(updates: Partial<UserData>): Promise<void>;
  getUserData(did: string): Promise<UserData>;
  createDocument(content: Record<string, any>, metadata: TileMetadataArgs): Promise<void>;
}

export const defaultCeramicContext: CeramicContextInterface = {
  isConnected: false,
  isLoadingUserData: true,
  userData: {},
  ensureConnected: async () => {
    console.log("default stub ensureConnected called");
  },
  updateUserData: async (updates: any) => {
    console.log("default stub updateUserData called with", updates);
  },
  getUserData: async (did: string) => {
    console.log("default stub getUserData called for", did);
    return {};
  },
  createDocument: async (content: any, metadata: any) => {
    console.log("default stub createDocument called", { content, metadata });
  },
};

export const CeramicContext = React.createContext(defaultCeramicContext);

let isConnecting = false;

export const CeramicProvider: React.FC = (props) => {
  const [isConnected, setIsConnected] = React.useState(false);
  const [isLoadingUserData, setIsLoadingUserData] = React.useState(true);
  const [ethAddress, setEthAddress] = React.useState("");
  const [userDid, setUserDid] = React.useState("");
  const [userData, setUserData] = React.useState<UserData>({});

  const ceramic = React.useMemo(() => new CeramicClient(API_URL), []);

  const ensureConnected = React.useMemo(() => {
    return async () => {
      if (isConnected || isConnecting) {
        return;
      }
      isConnecting = true;

      if (!ceramic) {
        throw Error("can't connect - ceramic library not yet initialized");
      }

      const addresses = await window.ethereum.enable();

      const threeIdConnect = new ThreeIdConnect();
      const authProvider = new EthereumAuthProvider(window.ethereum, addresses[0]);
      setEthAddress(addresses[0]);
      await threeIdConnect.connect(authProvider);
      const provider = await threeIdConnect.getDidProvider();

      const resolver = {
        ...ThreeIdResolver.getResolver(ceramic),
      };
      const did = new DID({ resolver });
      ceramic.did = did;
      ceramic.did.setProvider(provider);
      await ceramic.did.authenticate();

      setUserDid(ceramic.did.id);
      isConnecting = false;
      setIsConnected(true);

      const userDataDoc = (await TileDocument.deterministic(ceramic, {
        controllers: [ceramic.did.id],
        ...DEFAULT_TILE_METADATA,
      })) as any;
      console.log("[CeramicContext] Loaded current user data for DID", ceramic.did.id, userDataDoc.content);
      setUserData(userDataDoc.content || {});
      setIsLoadingUserData(false);

      // Added provision for account change
      window.ethereum.on('accountsChanged', () => {
        setIsConnected(false);
        setEthAddress("");
        setUserDid("");
        setUserData({});
      });
    };
  }, [ceramic, isConnected]);

  async function updateUserData(updates: Partial<UserData>) {
    if (!ceramic?.did) {
      throw Error("can't write: ceramic not initialized and authenticated");
    }
    console.log("[CeramicContext] Updating current user data with updates:", updates);

    const userDataDoc = (await TileDocument.deterministic(ceramic, {
      controllers: [ceramic.did.id],
      ...DEFAULT_TILE_METADATA,
    })) as any;

    const newData = {
      ...userDataDoc.content,
      ...updates,
    };
    await userDataDoc.update(newData);
    setUserData(newData);
  }

  async function createDocument(content: Record<string, any>, metadata: TileMetadataArgs): Promise<any> {
    const doc = await TileDocument.create(ceramic, content, metadata);
    console.log(
      "[CeramicContext] Successfully created doc: stream id",
      doc.id.toString(),
      "doc id",
      doc.commitId.toString(),
    );
  }

  async function getUserData(did: string): Promise<UserData> {
    console.log("[CeramicContext] Getting user data for DID:", did);
    const doc = (await TileDocument.deterministic(ceramic, {
      controllers: [did],
      ...DEFAULT_TILE_METADATA,
    })) as any;
    return doc.content;
  }

  const context = {
    ensureConnected,
    isConnected,
    isLoadingUserData,
    ethAddress,
    userDid,
    userData,
    updateUserData,
    getUserData,
    createDocument,
  };

  return <CeramicContext.Provider value={context}>{props.children}</CeramicContext.Provider>;
};

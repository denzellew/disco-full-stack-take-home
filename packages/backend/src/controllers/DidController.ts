import {Controller} from "@tsed/di";
import {Get, Post, Summary} from "@tsed/schema";
import { PathParams } from "@tsed/common";
import { DidService } from "../services/DidService";
import { Did } from "../entity/Did";
import { Profile } from "../types";
import { getProfileFromCeramic } from "../common/ceramic-util";

@Controller("/did")
export class GetProfileController {

  constructor(private readonly DidService: DidService) {

  }

  @Get("/getAllDids")
  @Summary("Return the DIDs of all Disco users")
  async getAllDids(): Promise<string[]> {
    const result = await this.DidService.getAllDids();
    return result.map(r => r.did);
  }

  @Post("/register/:did")
  @Summary("Register the given DID as a Disco user")
  async registerDid(@PathParams("did") did: string): Promise<boolean> {
    // Nothing really to change here. Do you wish to save profile data as well?
    console.log("@TODO: Implement me using this.DidService");
    const result = this.DidService.registerDid(did);

    return result;
  }

  @Get("/getProfileViaDid/:did")
  @Summary("Retrive the profile for a given DID")
  async getProfileViaDid(@PathParams("did") did: string): Promise<Profile | undefined> {
    // example call: http://0.0.0.0:8083/v1/did/getProfileViaDid/did:3:kjzl6cwe1jw148uyox3goiyrwwe3aab8vatm3apxqisd351ww0dj6v5e3f61e8b

    return await getProfileFromCeramic(did);
  }

  @Get("/getAllProfiles")
  @Summary("Retrive the profiles of all Disco users")
  async getAllProfiles(): Promise<Profile[]> {
    const result = await this.DidService.getAllDids();

    console.log(result);

    // Get profiles for each result
    let promises = result.map(did => getProfileFromCeramic(did.did))

    // Execute Async
    const promiseResults = await Promise.allSettled(promises);
    let profiles = promiseResults.filter(p => p.status === 'fulfilled').map(p => {
      if(p.status === 'fulfilled') {
        return <Profile>p.value;
      }
    });

    // Filter out the undefined for type friendly"ness"
    return <Profile[]>profiles.filter(p => p != undefined);
  }

}

import { Repository, EntityRepository } from "typeorm";
import { Did } from "../entity/Did"

@EntityRepository(Did)
export class DidRepository extends Repository<Did> {
  async saveDid(did: string) {
    return await this.save({did});
  }
  
  async findAllDids() {
    return await this.find();
  }

  async findDidExists(did: string) {
    return await this.count({where: {did: did}}) > 0;
  }
}

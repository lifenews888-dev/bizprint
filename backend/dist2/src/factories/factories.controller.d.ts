import { FactoriesService } from './factories.service';
export declare class FactoriesController {
    private readonly factoriesService;
    constructor(factoriesService: FactoriesService);
    getAll(): any[];
    selectFactory(body: any): any;
}

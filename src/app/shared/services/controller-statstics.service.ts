import { Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SwitchFlowStats } from '../switch-flow-stats';
import { SwitchPortStats } from '../switch-port-stats';

@Injectable()
export class ControllerStatsticsService {

  private controller_url = "http://192.168.56.101:8080/";
  // private controller_url = "http://localhost:8080/";

  constructor(private http: HttpClient) { }

  getFlowStats(switch_no:number): Observable<SwitchFlowStats>{
    return this.http.get(this.controller_url + "stats/flow/" + switch_no)
    	.catch(this.handleErrorObservable);
  }

  getPortStats(switch_no:number): Observable<SwitchPortStats>{
    return this.http.get(this.controller_url + "stats/port/"+switch_no)
    	.catch(this.handleErrorObservable);
  }

  getSwitches(): Observable<number[]> {
    return this.http.get(this.controller_url + "stats/switches")
    	.catch(this.handleErrorObservable);
  }

  private handleErrorObservable (error: Response | any) {
		console.error(error.message || error);
		return Observable.throw(error.message || error);
    }
}

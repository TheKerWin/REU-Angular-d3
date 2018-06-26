import { Node } from './node';
import { filter } from 'rxjs/operator/filter';

export class Link {
    id: number;
    nexthopNode: string;
    bw: number;
    nodeId: number[];
    xloc: number;
    yloc: number;
    enabled: boolean;
    active: boolean;
    byteRate: number;

    constructor(obj: any) {
        this.id = obj.id;
        this.nexthopNode = obj.nexthopNode;
        this.bw = obj.bw;
        this.nodeId = obj.nodeId;
        this.xloc = obj.xloc;
        this.yloc = obj.yloc;
        this.enabled = true;
        this.active = false;
        this.byteRate = 0;
    }


    getInfoLst() {
        var data = ["Link ID: " + this.id.toString(),
        "Bandwidth: " + this.bw.toString()];
        if (this.byteRate) {
            data.push("Bit rate: " + this.filterUnit(this.byteRate / 3, true));
        }
        return data;

    }
    equals(other: Link): boolean {
        if (!other) return false;
        return this.id == other.id
            && this.nexthopNode == other.nexthopNode
            && this.bw == other.bw
            && this.xloc == other.xloc
            && this.yloc == other.yloc
            && this.nodeId[0] == other.nodeId[0]
    }

    private filterUnit(count, isBytes) {
        if (isBytes) {
            count = count * 8;
        }

        if (count < 1000) {
            return count + " bps";
        }
        else if (count <= 1000000) {
            return (count / 1000).toFixed(2) + " Kbps"
        }
        else if (count <= 1000000000) {
            return (count / 1000000).toFixed(2) + " Mbps"
        }
        else {
            return (count / 1000000000).toFixed(2) + " Gbps"
        }
    };
}

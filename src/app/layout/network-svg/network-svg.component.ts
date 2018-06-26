import { Component, ElementRef, NgZone, OnDestroy, Input, OnChanges } from '@angular/core';
import { Node } from '../../shared/node';
import { Link } from '../../shared/link';
import { Network } from '../../shared/network';
import { NetworkService } from '../../shared/services/network.service'
import * as d3 from 'd3';
import {
  D3Service,
  D3
} from 'd3-ng2-service';
import { WirelessNode } from '../../shared/wirelessnode';


@Component({
  selector: 'app-network-svg',
  templateUrl: './network-svg.component.html',
  styleUrls: ['./network-svg.component.scss']
})
export class NetworkSvgComponent implements OnChanges {

  private static readonly NODE_RADIUS = 20;
  private static readonly COLORS = {
    "line": "dodgerblue",
    "active_line": "#34BD62",
    "line-disabled": "darkred",
    "text": "#292b2c",
    "packet": "white"
  };
  private static readonly PADDING = 20;
  private static readonly SVG_FILL = "#292b2c";
  private static readonly PACKETS_PER_LINE = 3;
  private static readonly PACKET_LENGTH = 6;
  private static readonly PACKET_TIME = 100;

  private parentNativeElement: any;

  @Input()
  nodes: Node[];
  @Input()
  links: Link[];
  @Input()
  active_nodes: number[];

  selectedNode: Node;
  editting: boolean = false;
  networkService: NetworkService;
  oldx: number = 0;
  oldy: number = 0;
  static mousedown: boolean = false;
  index: number = 0;

  ports = {
    "1": {
      "2": 6
    },
    "2": {
      "2": 5
    },
    "3": {
      "2": 6
    },
    "4": {
      "2": 6
    },
    "5": {
      "2": 6,
      "3": 2
    },
    "6": {
      "2": 3,
      "3": 1,
      "4": 4,
      "5": 5
    },
  }

  constructor(d3Service: D3Service, networkService: NetworkService) {
    this.networkService = networkService;
  }

  ngOnChanges(): void {
    if (this.links) {
      // Assume all links are not active until decided later
      this.links.forEach(link => {
        link.active = false;
      })
    }

    if (this.nodes) {
      if (this.active_nodes) {
        console.log(this.active_nodes)
        var link_pairs = this.active_nodes.filter(function (pair) {
          return (this.ports[pair[0]][pair[1]]);
        }, this).map(function (pair) {
          return [this.getNodeById(pair[0]), this.getNodeById(this.ports[pair[0]][pair[1]])];
        }, this);
        for (let link_pair of link_pairs) {
          let l = this.getLink(link_pair[0], link_pair[1]);
          if (l) {
            l.active = true;
          }
        }
      }
      this.myOnInit();
    }
  }

  getNodeByIp(ip: string): Node {
    return this.nodes.find(function (n) {
      let thisNode = false;
      n.wireless.forEach(wn => {
        if (wn.ipAdd === ip) {
          thisNode = true;
        }

      })
      return thisNode;
    })
  }

  getNodeById(id: number): Node {
    return this.nodes.find(function (n) { return n.id == id; })
  }

  displayWireless(i: number) {
    this.index = i;
  }

  myOnInit() {
    var comp = this;

    if (this.nodes.length > 0 && !this.nodes[0].wireless) {
      return;
    }

    this.links.forEach(function (link) {

      let n = comp.nodes.find(function (node) {
        return node.id === link.nodeId[0];
      })
      if (n) {
        n.x = link.xloc;
        n.y = link.yloc;
      }

    })

    var svg = d3.select("svg")
    d3.selectAll('svg > *').remove()
    svg.style("background-color", NetworkSvgComponent.SVG_FILL);
    let width = svg.style('width');
    let height = parseInt(svg.style('height'));

    let locations = {
      "woodward": "35.3070814,-80.735740"
    }
    let url = "https://maps.google.com/maps/api/staticmap" +
      "?key=AIzaSyCDvRL-n6Nh7bnPv4VsAhFKdWCRxc6LcI8" +
      "&center=" + locations.woodward +
      "&zoom=20" +
      "&size=300x600" +
      "&maptype=roadmap" +
      // "&scale=2" +
      "&style=feature:landscape|element:geometry.fill|color:0x292b2c" +
      "&style=feature:landscape|element:geometry.stoke||color:0x000000" +
      "&style=feature:all|element:labels|visibility:off"
    svg.append('image')
      .attr("id", "map")
      // .attr('xlink:href', url)
      .attr('xlink:href', 'assets/images/floor2.svg')
      // .attr('transform', "translate(705 -300) rotate(90 180 15)")
      .attr('width', 900)             
      .attr('height', 600)

    this.nodes.forEach(function (node, i) {
      if (node.x || node.y) return;
      node.x = Math.cos((i / this.nodes.length) * Math.PI * 2) * 200 + 450;
      node.y = Math.sin((i / this.nodes.length) * Math.PI * 2) * 200 + 300;
    }, this)

    let delete_hover = function () {
      svg.select("#hover").remove();
      d3.select(this).attr('r', NetworkSvgComponent.NODE_RADIUS);
    }
   
    let on_hover = function (d) {
      svg.select("#hover").remove();

      d3.select(this).attr('r', NetworkSvgComponent.NODE_RADIUS + 5)
      let info = d.getInfoLst()

      let g = svg.append("g")
        .attr("id", "hover");
      let size = d.getInfoLst().length
      let NodeInfo = d.getInfoLst()
      let MaxInfolen = 0

      // Calculate Rectangle width
      for (var x = 0; x < NodeInfo.length; x++) {
        var CurInfoLen = NodeInfo[x].length
        if (CurInfoLen > MaxInfolen) {
          MaxInfolen = CurInfoLen
        }
      }
      var RectWidth = (MaxInfolen * 8.5) + 10

      //Determine HoverBox position & keeps it inside the map
      var imagelimit = d3.select('#map').attr('height')
      var coords = d3.mouse(this)

      // X component limiter (flip over)
      if (d3.mouse(this)[0] > 668) {
        coords[0] = coords[0] - 10 - RectWidth
      }
      // Y component limiter
      if (d3.mouse(this)[1] > 300) {
        coords[1] = coords[1] - 15
      }
      // bottom of image
      if (d3.mouse(this)[1] + ((size + 0.5) * 13.90) > imagelimit) {
        coords[1] = imagelimit - ((size + 0.5) * 13.90) - 30
      }

      g.append("rect")
        .attr("x", coords[0] + 5)
        .attr("y", coords[1] - (((size + 1) * 2.3) - 27))
        .attr("width", RectWidth)
        .attr("height", (size + 0.5) + "em")
        .attr("fill", "AliceBlue")
        .attr("stroke", "#333333")
        .attr("stroke-width", 2)
        .attr("stroke-opacity", .4)
        .attr("opacity", ".750")
        .attr("rx", 3)
        .attr("ry", 3);
      let text = g.append("text")
        .attr("x", coords[0] + 5)
        .attr("y", coords[1] - (((size + 1) * 2.3) - 27))
        .attr("fill", NetworkSvgComponent.COLORS["TEXT"]);
      d.getInfoLst().forEach(function (info) {
        text.append('tspan')
          .text(info)
          .attr('dy', 1 + 'em')
          .attr('x', coords[0] + 10); //Original + 5
      })
    }

    for (let x = 0; x < this.nodes.length; x++) {
      for (let i = x + 1; i < this.nodes.length; i++) {
        svg.append('line').attr('class', 'allLines')
          .attr('node1', x)
          .attr('node2', i)
          .attr('stroke-width', 5)
          .attr('stroke', 'dodgerblue')
          .attr('opacity', .2)
      }
    }
    // Visual lines between nodes
    var lines = svg.selectAll('.link')
      .data(this.links)
      .enter()
      .append('line')
      .attr('stroke-width', 5)
      .attr("class", "link")
      .attr("stroke", NetworkSvgComponent.COLORS['line'])
      .on("mousemove", on_hover)
      .on("mouseout", delete_hover)
      .on('dblclick', function (l) {
        l.enabled = !l.enabled;
        render(comp);
      })

    var nodes = svg.selectAll("image.nodes")
      .data(this.nodes)
      .enter()
      .append("image")
      .attr('xlink:href', 'assets/images/router.svg')
      .attr('width', 50)
      .attr('height', 50)
      .on("mousemove", on_hover)
      .on("mouseout", delete_hover)
      .on("click", function (d) { comp.editNode(d) });

    render(comp);

    let dragHandler = d3.drag().on('start', function (d) {
      svg.select("#hover").remove();
      comp.oldx = d.x;
      comp.oldy = d.y;
      NetworkSvgComponent.mousedown = true;
    })
      .on('drag', function (d) {
        svg.select("#hover").remove();
        let coords = d3.mouse(this);
        if (coords[0] + 20 < parseInt(width) && coords[0] - 20 > 0
          && coords[1] + 20 < height && coords[1] - 20 > 0) {
          d.x = coords[0];
          d.y = coords[1];
          let node = d3.select(this);
          node.attr('x', d.x + 25)
          node.attr('y', d.y + 25);
          render(comp);
        }
      })
      .on("end", function (d) {
        NetworkSvgComponent.mousedown = false;
        let links = []
        comp.links.forEach(function (link) {
          if (link.nodeId[0] === d.id) {
            links.push(link);
          }
        })

        if (comp.oldx != d.x || comp.oldy != d.y) {
          links.forEach(function (link) {
            link.xloc = d.x;
            link.yloc = d.y;
            comp.networkService.updateTopology(link).subscribe()
          })
        }
      })

    dragHandler(svg.selectAll('image.nodes'));

    function render(comp) {
      svg.selectAll('.allLines')
        .each(function () {
          let line = d3.select(this);
          let node1 = parseInt(line.attr('node1'))
          let node2 = parseInt(line.attr('node2'))
          line.attr('x1', comp.nodes[node1].x)
            .attr('y1', comp.nodes[node1].y)
            .attr('x2', comp.nodes[node2].x)
            .attr('y2', comp.nodes[node2].y)
        })
      lines.attr("x1", function (l) { return comp.getNodeById(l.nodeId[0]).x; })
        .attr("y1", function (l) { return comp.getNodeById(l.nodeId[0]).y; })
        .attr("x2", function (l) { return comp.getNodeByIp(l.nexthopNode).x; })
        .attr("y2", function (l) { return comp.getNodeByIp(l.nexthopNode).y; })
        .attr("id", function (l) {
          var node1 = comp.getNodeByIp(l.nexthopNode);
          var node2 = comp.getNodeById(l.nodeId[0]);
          return "line-" + node1.id + "-" + node2.id;
        })
        .attr('stroke', function (l) {
          if (l.active) {
            return NetworkSvgComponent.COLORS['active_line'];
          } else if (!l.enabled) {
            return NetworkSvgComponent.COLORS['line-disabled']
          } else {
            return NetworkSvgComponent.COLORS['line'];
          }
        })

      nodes.attr('class', 'nodes')
        .attr("x", function (d) { return d.x - 25; })
        .attr("y", function (d) { return d.y - 25; })

    }
  }

  editNode(d) {
    var comp = this;
    let modal = document.getElementById('myModal');
    let editModal = document.getElementById('myEditModal');
    let node = d3.select(this);
    this.selectedNode = d;
    modal.style.display = "block";
    let span = document.getElementsByClassName("close")[0];
    span.addEventListener("click", function () {

      modal.style.display = "none";
      comp.editting = false;

    })

    let editButton = document.getElementById("editButton");
    editButton.addEventListener("click", function () {

      comp.editting = true;

    })

    let saveButton = document.getElementById("saveButton");
    saveButton.addEventListener("click", function () {

      comp.editting = false;
      modal.style.display = "none";
      comp.networkService.updateNode(comp.selectedNode).subscribe()

    })
  }

  getLink(n1: Node, n2: Node): Link {
    for (let x = 0; x < this.links.length; x++) {
      if (this.links[x].nodeId[0] == n1.id && this.links[x].nexthopNode === n2.wireless[0].ipAdd) {
        return this.links[x];
      }
      if (this.links[x].nodeId[0] == n2.id && this.links[x].nexthopNode === n1.wireless[0].ipAdd) {
        return this.links[x];
      }
    }
    return null;
  }
}

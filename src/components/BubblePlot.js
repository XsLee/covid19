import React, { Component } from 'react'
import { ResponsiveBubble } from '@nivo/circle-packing'
import { interpolateMagma } from 'd3-scale-chromatic'
import { getDataFromRegion } from '../utils/utils'

export default class BubblePlot extends Component {
    state = {
        plotData: null,
        currentNodePath: null
    }

    generate = (obj) => {
        const { date, lang } = this.props
        return Object.entries(obj)
            .filter(([ k, v ]) => ![ 'confirmedCount', 'deadCount', 'curedCount', 'ENGLISH', '全球' ].includes(k))
            .map(([ k, v ]) => {
                let newdata = {
                    name: k,
                    displayName: lang === 'zh' ? k : v.ENGLISH
                }

                if (Object.keys(v).length > 4) {
                    newdata.children = this.generate(v)
                } else {
                    // no children
                    newdata.confirmedCount = v.confirmedCount && v.confirmedCount[date] ? v.confirmedCount[date] : 0
                    newdata.deadCount = v.deadCount && v.deadCount[date] ? v.deadCount[date] : 0
                    newdata.curedCount = v.curedCount && v.curedCount[date] ? v.curedCount[date] : 0
                }
                return newdata
            })
    }

    // hack so that bubble plot can interact with other plots
    handleNodeClick = (node) => {
        const region = node.path === '全球' ? [ node.path ] : node.path.split('.').reverse().slice(1)
        this.props.regionToggle(region)

        if (node.path.endsWith('中国.全球')) {
            if (region.length >= 4) {
                this.props.mapToggle('CHN2')
            } else if (this.props.currentMap === 'WORLD') {
                this.props.mapToggle('CHN1')
            }
        } else {
            this.props.mapToggle('WORLD')
        }
    }

    render() {
        const { data, metric, currentRegion, date } = this.props
        if (data == null) return <div />
        const plotData = {
            name: '全球',
            displayName: 'Global',
            children: this.generate(data)
        }
        let currentNodePath = currentRegion[0] === '全球' ? '全球' : [ '全球', ...currentRegion ].reverse().join('.')

        // TODO: Node does not exist when count is 0. Need to find the parent node that has non-zero count.
        const count = getDataFromRegion(data, currentRegion)[metric][date]
        if (count == null || count === 0)
            currentNodePath = [ '全球', ...currentRegion.slice(0, currentRegion.length - 1) ].reverse().join('.')

        return (
            <div style={{ height: 300, width: '100%' }}>
                <ResponsiveBubble
                    ref={this.bubble}
                    root={plotData}
                    margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    tooltip={({ color, value, data }) => (
                        <span className="plot-tooltip" style={{ color: color === '#fff' ? '#222' : color }}>
                            {data.displayName}
                            <span className="plot-tooltip-bold">{` ${value}`}</span>
                        </span>
                    )}
                    identity="name"
                    value={metric}
                    colors={[ ...[ 0.3, 0.4, 0.2, 0.1 ].map((x) => interpolateMagma(1 - x)), '#fff' ]}
                    padding={4}
                    enableLabel={true}
                    label={({ data }) => data.displayName}
                    labelTextColor={'#222'}
                    labelSkipRadius={12}
                    animate={true}
                    motionStiffness={50}
                    motionDamping={12}
                    onClick={this.handleNodeClick}
                    currentNodePath={currentNodePath}
                    test={'test'}
                />
            </div>
        )
    }
}

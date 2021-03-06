import { Set } from 'immutable';
import fileDownload from 'js-file-download';
import M from "materialize-css";
import React from "react";
import { fetch_data } from "../../util/fetch/data";
import { fetch_meta, fetch_meta_post } from "../../util/fetch/meta";
import Collections from '../Collections';
import MetadataSearch from '../MetadataSearch';
import SignatureSearch from '../SignatureSearch';
import Upload from '../Upload';

export default class Home extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      search: '',
      results: [],
      cart: Set(),
      time: 0,
      count: 0,
      key_count: {},
      value_count: {},
      status: null,
      controller: null,
    }

    this.submit = this.submit.bind(this)
    this.build_where = this.build_where.bind(this)
    this.fetch_values = this.fetch_values.bind(this)
    this.download = this.download.bind(this)
  }

  componentDidMount() {
    M.AutoInit();
  }

  componentDidUpdate() {
    M.AutoInit();
    M.updateTextFields();
  }

  build_where() {
    if (this.state.search.indexOf(':') !== -1) {
      const [key, ...value] = this.state.search.split(':')
      return {
        ['meta.' + key]: {
          ilike: '%' + value.join(':') + '%'
        }
      }
    } else {
      return {
        meta: {
          fullTextSearch: this.state.search
        }
      }
    }
  }

  async submit() {
    if(this.state.controller !== null) {
      this.state.controller.abort()
    }
    try {
      const controller = new AbortController()
      this.setState({
        status: 'Searching...',
        controller: controller,
      })

      const where = this.build_where()

      const start = Date.now()
      const results = await fetch_meta_post('/signatures/find', {
        filter: {
          where,
          limit: 20,
        },
      }, controller.signal)

      this.setState({
        results,
        status: '',
        time: Date.now() - start,
      })

      const key_count = await fetch_meta('/signatures/key_count', {
        filter: {
          where,
        },
      }, controller.signal)

      this.setState({
        key_count,
        count: key_count['$validator'],
        controller: null,
      }, () => M.AutoInit())
    } catch(e) {
      if(e.code !== DOMException.ABORT_ERR) {
        this.setState({
          status: e + ''
        })
      }
    }
  }

  async fetch_values(key) {
    this.setState({
      value_count: {},
    })
    const where = this.build_where()
    const value_count = await fetch_meta('/signatures/value_count', {
      filter: {
        where,
        fields: [
          key,
        ]
      },
      depth: 2,
    })
    this.setState({
      value_count,
    })
  }

  async download(id) {
    try {
      const controller = new AbortController()

      let ids
      if(id === undefined) {
        ids = this.state.cart.toArray()
      } else {
        ids = [id]
      }

      const signature_data = (await fetch_data('/fetch/set', {
        entities: [],
        signatures: ids,
        database: 'enrichr',
      }, controller.signal)).signatures
      
      const signatures = signature_data.map((sig) => sig.uid)
      const entities = signature_data.reduce((all, sig) => [...all, ...sig.entities], [])

      const signature_metadata = await fetch_meta_post('/signatures/find', {
        filter: {
          where: {
            id: {
              inq: signatures,
            }
          }
        }
      }, controller.signal)
      const entity_metadata = await fetch_meta_post('/entities/find', {
        filter: {
          where: {
            id: {
              inq: entities,
            }
          }
        }
      }, controller.signal)
      const data = {
        entities: entity_metadata,
        signatures: signature_metadata,
        values: signature_data,
      }
      fileDownload(JSON.stringify(data), 'data.json');
    } catch(e) {
      console.error(e)
    }
  }

  render() {
    return (
      <div className="root">
        <header>
          <nav className="nav-extended">
            <div className="nav-wrapper teal">
              <a
                href="/"
                className="brand-logo center"
                style={{
                  whiteSpace: 'nowrap',
                }}
              >Signature Commons Metadata Search</a>
              <a href="#!" data-target="slide-out" className="sidenav-trigger show-on-large"><i className="material-icons">menu</i></a>
            </div>
            <div className="nav-content teal">
              <ul className="tabs tabs-transparent">
                <li className="tab">
                  <a href="#MetadataSearch">
                    Metadata Search
                  </a>
                </li>
                <li className="tab">
                  <a href="#SignatureSearch">
                    Signature Search
                  </a>
                </li>
                <li className="tab">
                  <a href="#Collections">
                    Collections of Signatures
                  </a>
                </li>
                <li className="tab">
                  <a href="#UploadCollection">
                    Upload a Collection
                  </a>
                </li>
              </ul>
            </div>
          </nav>
        </header>

        <ul id="slide-out" className="sidenav">
          {Object.keys(this.state.key_count).filter((key) => !key.startsWith('$')).map((key) => (
            <li key={key} className="no-padding">
              <ul className="collapsible collapsible-accordion">
                <li>
                  <a
                    href="#!"
                    className="collapsible-header"
                  >
                    {key} ({this.state.key_count[key]})
                  </a>
                  <div className="collapsible-body">
                    {this.state.value_count[key] === undefined ? null : (
                      <ul>
                        {Object.keys(this.state.value_count[key]).map((k) => (
                          <li key={key + '.' + k}>
                            <a href="#!">
                              <label>
                                <input type="checkbox" />
                                <span>
                                  {k} ({this.state.value_count[key][k]})
                                </span>
                              </label>
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              </ul>
            </li>
          ))}
        </ul>

        {this.state.cart.count() <= 0 ? null : (
          <div className="fixed-action-btn">
            <a
              href="#!"
              className="btn-floating btn-large teal"
            >
              <i className="large material-icons">shopping_cart</i>
            </a>
            <span style={{
              position: 'absolute',
              top: '-0.1em',
              fontSize: '150%',
              left: '1.4em',
              zIndex: 1,
              color: 'white',
              backgroundColor: 'blue',
              borderRadius: '50%',
              width: '35px',
              height: '35px',
              textAlign: 'center',
              verticalAlign: 'middle',
            }}>
              {this.state.cart.count()}
            </span>
            <ul>
              <li>
                <a
                  href="#!"
                  className="btn-floating red"
                  onClick={this.download}
                >
                  <i className="material-icons">file_download</i>
                </a>
              </li>
              <li>
                <a
                  href="#SignatureSearch"
                  className="btn-floating green"
                >
                  <i className="material-icons">functions</i>
                </a>
              </li>
              <li>
                <a
                  href="#!"
                  className="btn-floating grey"
                  onClick={() => alert('Comming soon')}
                >
                  <i className="material-icons">send</i>
                </a>
              </li>
            </ul>
          </div>
        )}

        <MetadataSearch
          id="MetadataSearch"
          cart={this.state.cart}
          updateCart={(cart) => this.setState({cart})}
          download={this.download}
        />
        <SignatureSearch
          id="SignatureSearch"
          cart={this.state.cart}
          updateCart={(cart) => this.setState({cart})}
          download={this.download}
        />
        <Collections
          id="Collections"
          cart={this.state.cart}
          updateCart={(cart) => this.setState({cart})}
          download={this.download}
        />
        <Upload
          id="UploadCollection"
          cart={this.state.cart}
          updateCart={(cart) => this.setState({cart})}
          download={this.download}
        />

        <footer className="page-footer grey lighten-3 black-text">
          <div className="container">
            <div className="row">
              <div className="col m5 s12">
                <img src="https://amp.pharm.mssm.edu/enrichmentapi/images/mountsinai.png" alt="Icahn School of Medicine at Mount Sinai, Center for Bioinformatics" height="130" />
              </div>
              <div className="col l5 m7 s12">
                <ul style={{paddingLeft: '30px', listStyle: 'none', textAlign: 'left'}}>
                  <li className="fl"><a href="http://icahn.mssm.edu/research/labs/maayan-laboratory" target="_blank" rel="noopener noreferrer">The Ma'ayan Lab</a></li>
                  <li className="fl"><a href="http://www.lincs-dcic.org/" target="_blank" rel="noopener noreferrer">BD2K-LINCS Data Coordination and Integration Center (DCIC)</a></li>
                  <li className="fl"><a href="http://www.lincsproject.org/">NIH LINCS program</a></li>
                  <li className="fl"><a href="https://commonfund.nih.gov/commons">NIH Data Commons Pilot Project Consortium (DCPPC)</a></li>
                  <li className="fl"><a href="http://bd2k.nih.gov/" target="_blank" rel="noopener noreferrer">NIH Big Data to Knowledge (BD2K)</a></li>
                  <li className="fl"><a href="https://commonfund.nih.gov/idg/index" target="_blank" rel="noopener noreferrer">NIH Illuminating the Druggable Genome (IDG) Program</a></li>
                  <li className="fl"><a href="http://icahn.mssm.edu/" target="_blank" rel="noopener noreferrer">Icahn School of Medicine at Mount Sinai</a></li>
                </ul>
                <ul style={{paddingLeft: '30px', listStyle: 'none', textAlign: 'left'}}>
                  <li className="fl"><a href="http://petstore.swagger.io/?url=http://amp.pharm.mssm.edu/signature-commons-metadata-api/openapi.json" target="_blank" rel="noopener noreferrer">Metadata API Documentation</a></li>
                  {/* <li className="fl"><a href="http://petstore.swagger.io/?url=http://amp.pharm.mssm.edu/enrichmentapi/swagger.json" target="_blank" rel="noopener noreferrer">Data API Documentation</a></li> */}
                </ul>
              </div>
              <div className="col l2 m6 s12">
                <img src="https://amp.pharm.mssm.edu/enrichmentapi/images/dcic.png" alt="BD2K-LINCS Data Coordination and Integration Center" height="130" /><br />
                © Ma'ayan Lab.
              </div>
            </div>
          </div>
        </footer>
      </div>
    );
  }
}

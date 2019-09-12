import React from 'react'
import ChipInput from 'material-ui-chip-input'
import { withStyles } from '@material-ui/core/styles'
import Grid from '@material-ui/core/Grid'
import Chip from '@material-ui/core/Chip'
import Tooltip from '@material-ui/core/Tooltip'
import Typography from '@material-ui/core/Typography'
import { fetchMetaDataFromSearchBox } from "../../util/redux/actions";
import { connect } from "react-redux";
import { SearchBox } from "./SearchBox"

const styles = (theme) => ({
  info: {
    paddingTop: theme.spacing.unit * 2,
    paddingBottom: theme.spacing.unit * 2,
  },
  chip:{
    margin: theme.spacing.unit/2,
  },
  defaultChip: {
    ...theme.chipColors.default,
  },
  defaultLightChip: {
    ...theme.chipColors.defaultLight,
  },
  notChip: {
    ...theme.chipColors.alert,
  },
  orChip: {
    ...theme.chipColors.warning,
  },
  tooltip: {
    backgroundColor: "#FFF",
    maxWidth: 380,
  },
  tooltipButton: {
    marginTop:5,
    padding: "5px 0"
  },
  icon: {
    paddingBottom: 35,
    paddingLeft: 5,
  },
})

function mapDispatchToProps(dispatch) {
  return {
    searchFunction : (search) => 
      dispatch(fetchMetaDataFromSearchBox(search))
  };
}

const mapStateToProps = state => {
  return { loading: state.loading,
    completed: state.completed,
    examples: state.serverSideProps.ui_values.LandingText.search_terms,
    placeholder: state.serverSideProps.ui_values.LandingText.metadata_placeholder,
    search: state.search,
    operationIDs: state.operationIDs
  };
};


class MetadataSearchBox extends React.Component {


  render() {
    return (
      <SearchBox 
        {...this.props}
        searchFunction={this.props.searchFunction}
      />
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(MetadataSearchBox))

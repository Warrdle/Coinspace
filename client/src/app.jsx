import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import SmallCurrencyToggle from './components/SmallCurrencyToggle.jsx';
import TriComponentRow from './components/TriComponentRow.jsx';
import CoinChart from './components/CoinChart.jsx';
import Chat from './components/Chat.jsx';
import SignUp from './components/SignUp.jsx';
import SignIn from './components/SignIn.jsx';
import moment from 'moment';
import Delay from 'react-delay';
import PortfolioPage from './components/PortfolioPage.jsx';
import Modal from 'react-responsive-modal';

class FBLogin extends React.Component {
  constructor(props) {
    console.log("FBLogin constructor initiated");
    super(props);
    this.state = {};

    //FB Javascript SDK //load with the page
    (function(d, s, id){
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) {return;}
      js = d.createElement(s); js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));

  }

  //SDK setup

  //adpted from window.fbAsyncInit
  fbAsyncInit() {
    FB.init({
      appId      : '142468679794360', //our app's id on facebook
      xfbml      : true,
      version    : 'v2.11' //needs to be the lastest facebook sdk version
    });
    // FB.AppEvents.logPageView();

    //check if we're logged in
    FB.getLoginStatus(function(response) {
      this.statusChangeCallback(response);
    });
  };

  //statusChangeCallback
  statusChangeCallback(response) {

    if (response.status === 'connected') {
      console.log('Logged in and authenticated');
      console.dir(response);
      this.testAPI("/me?fields=name,email");

    } else {
      console.log('Not authenticated');
    }
  }

  //checks if logged in
  checkLoginState() {

    FB.getLoginStatus(function(response) {
      this.statusChangeCallback(response);
    });
  }

  //test incoming data
  testAPI(query) {

    FB.api(query, function(response) {

      if (response) {

        if (!response.error) {
          console.log("Welcome, ", response.name);
          console.dir(response);
          this.buildProfile(response,console.log);

        } else {
          console.dir(response.error);
        }
        
      } else {
        console.log("no response from API");
      }
    });
  };

  //build a profile
  buildProfile(response, callback) {
    let user = {
      name: response.name,
      email: response.email
    };

    callback(user);
  };

  render() {


    console.log("FBLogin render initiated");

    let login = this.checkLoginState.bind(this);

    let loginButton = (

      <div>
        <fb-login-button
          data-max-rows="1"
          data-size="large"
          data-button-type="login_with"
          data-show-faces="false"
          data-auto-logout-link="false"
          data-use-continue-as="false"

          scope="public_profile,email"
          onlogin={login}>
        </fb-login-button>
      </div>
    );

  return loginButton;
  }
  
}




class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentCoin: 1,
      currentTimePeriod: '1Y',
      hourlyData: [],
      dailyData: [],
      weeklyData: [],
      monthlyData: [],
      yearlyData: [],
      historicalData: [],
      chartData: {},
      coins: [
        ['Bitcoin', 'rgba(79, 232, 255, 0.1)', '#4FC7FF'],
        ['Ethereum', 'rgba(241, 245, 125, 0.1)', '#f2b632'],
        ['Litecoin', 'rgba(125, 245, 141, 0.1)', '#2ECC71'],
        ['Ripple', 'rgba(255, 148, 180, 0.1)','#FF4A4A']
      ],
      labels: {
        //'1H': ['hourlyData', 'minutes', 'hh:mm a', 'Past Hour'],
        '1D': ['dailyData', 'hours', 'hh:mm a', 'Since Yesterday'],
        '1W': ['weeklyData', 'days', 'MMM DD', 'Since Last Week'],
        '1M': ['monthlyData', 'days', 'MMM DD', 'Since Last Month'],
        '1Y': ['yearlyData', 'months', 'MMM DD', 'Since Last Year'],
        //'ALL': ['historicalData', 'days', 'MMM YYYY', 'Since Forever'
        
      },
      renderedPage: 'Charts'
    };
    this.changePage = this.changePage.bind(this);
    this.addData = this.addData.bind(this);
  }

  componentDidMount() {
    axios.get('/init')
      .then(results => {
        this.setState({
          hourlyData: results.data[1],
          dailyData: results.data[1],
          weeklyData: results.data[2],
          monthlyData: results.data[1],
          yearlyData: results.data[0],
          historicalData: results.data[0]
        });
      }).then(() => {
        this.getUpdate();
      }).then(()=> {
        this.getChartData();
      }).catch(err => {
        console.log('init client', err);
      });
    // React Cronjob
    // let minute = new Date().getMinutes() % 15;
    // console.log(15 - minute, 'minutes left');
    // new Promise(() => {
    //   setTimeout(this.getUpdate, 900000 - 60000 * minute)
    // }).then(() => {
    //   // setInterval(this.getUpdate, 1800000);
    // }).catch(err => {
    //   console.log('set interval err', err);
    // });
  }

  getChartData(){
    // Define the initial labels.
    var inputLabel = [];
    for (let i = 0; i < 365; i++) {
      inputLabel.push(moment().subtract(i, 'days').format('MMM YYYY'));
    }
    this.setState({
      chartData:{
        labels: inputLabel.reverse(),
        datasets:[
          {
            label:'Price',
            data: this.state.historicalData.filter((allCoins) => allCoins.coin_id === this.state.currentCoin).map((entry) => entry.price),
            backgroundColor:[this.state.coins[0][1]],
            borderColor: [this.state.coins[0][2]]
          }
        ]
      }
    });
  }

  onSetCoin(coinID) {
    let currentDataSet = this.state[this.state.labels[this.state.currentTimePeriod][0]];
    let inputData = currentDataSet.filter((allCoins) => allCoins.coin_id === parseInt(coinID)).map((entry) => entry.price);
    this.setState({
      currentCoin: +coinID,
      chartData: {
        labels: this.state.chartData.labels,
        datasets:[
          {
            label:'Price',
            data: inputData,
            backgroundColor:[this.state.coins[coinID - 1][1]],
            borderColor: [this.state.coins[coinID - 1][2]]
          }
        ]
      }
    });
  }

  onSetTimePeriod(e) {
    let label = this.state.labels[e.target.value];
    let currentDataSet = this.state[label[0]];
    let inputData = currentDataSet.filter((allCoins) => +allCoins.coin_id === +this.state.currentCoin).map((entry) => entry.price);
    let inputLabel = inputData.map((data, index) => moment().subtract(index, label[1]).format(label[2]));
    this.setState({
      currentTimePeriod: e.target.value,
      chartData: {
        labels: inputLabel.reverse(),
        datasets:[
          {
            label:'Price',
            data: inputData,
            //background-image: url('/../img/rise-green.gif'),
            backgroundColor:[this.state.coins[this.state.currentCoin - 1][1]],
            borderColor: [this.state.coins[this.state.currentCoin - 1][2]]
          }
        ]
      }
    });
  }

  addData(data) {
    this.setState({
      hourlyData: [...this.state.hourlyData, ...data],
      dailyData: [...this.state.dailyData, ...data],
      weeklyData: [...this.state.weeklyData, ...data],
      monthlyData: [...this.state.monthlyData, ...data],
      yearlyData: [...this.state.yearlyData, ...data],
      historicalData: [...this.state.historicalData, ...data]
    });
  }

  getUpdate() {
    // axios call to server
    // on success, set timeout(at the 00 minute, set the state)
    axios.get('/update')
      .then(results => {
        let minute = new Date().getMinutes() % 30;
        console.log(`Half hour update in ${30 - minute} minutes`);
        console.log(results.data.rows);
        console.log(this);
        // this.addData(results.data.rows);
        setTimeout(()=>{
          this.addData(results.data.rows);
        }, 1800000 - 60000 * minute);
      }).catch(err => {
        console.log('update err', err);
      });
  }

  changePage(e) {
    this.setState({
      renderedPage: e.target.name
    });
  }

  render() {

    //removed temporarily
      /*<a className="item" name="Charts" onClick={this.changePage}>Charts</a>*/
      /*<a className="item" name="Portfolio" onClick={this.changePage}>Portfolio</a>*/


    if (this.state.weeklyData.length === 0) {
      return <div/>;
    } else if (!this.state.chartData.datasets) {
      return <div/>;
    }

    return (
      <div id="mainWrapper">

        

        <div id="mainMenu" className="ui massive inverted menu">
          <div className="ui container">
            <div className="right menu">
              <div className="item">
                <a className="item right">Log in</a>
              </div>
            </div>
            {console.log('THIS STATE', this.state)}
          </div>
        </div>

        {
          this.state.renderedPage === 'Charts' ? (
            <div className="ui grid">
              <div className="three column row"></div>
              <div className="sixteen column row">
                <div className="one wide column"></div>
                {this.state.coins.map((coin, index) =>
                  <SmallCurrencyToggle key={index} onSetCoin={this.onSetCoin.bind(this)} coin_id={index + 1} name={coin[0]} coin={this.state.weeklyData.filter((allCoins) => {return allCoins.coin_id === index + 1})[0].price} />
                )}
                <div className="three wide column"></div>
                {Object.keys(this.state.labels).map((label, index) =>
                  <button className="ui left floated mini button" key={index} value={label} onClick={this.onSetTimePeriod.bind(this)}>{label}</button>
                )}
              </div>

              <div className="row">
                <div className="ui five column divided grid TriComponentRow">
                  <TriComponentRow state={this.state} chartData={this.state.chartData} currentCoin={this.state.currentCoin} currentTimePeriod={this.state.currentTimePeriod}/>
                </div>
              </div>
              <CoinChart chartData={this.state.chartData} onSetCoin={this.onSetCoin.bind(this)} onSetTimePeriod={this.onSetTimePeriod.bind(this)}/>

            </div>
          ) : (

            <PortfolioPage chartData={this.state.chartData} onSetCoin={this.onSetCoin.bind(this)} onSetTimePeriod={this.onSetTimePeriod.bind(this)}/>

          )
        }
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('app'));

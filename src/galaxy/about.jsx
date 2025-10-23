import React from 'react';
export default require('maco').template(about, React);

function about() {
  return (
  <div  className='label about'>
     <a className='reset-color'
        target='_blank'
        href="https://openreview.net/pdf?id=1rh8iTehBc">About...</a>
  </div>
  );
}

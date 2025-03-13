import React, { useState } from "react";
import "../Footer/footer.css"
import { Col, Container, Row ,ListGroup} from "react-bootstrap";
import { NavLink } from "react-router-dom";

const Footer = () => {
  const [visible, setVisible]=useState(false);

  const toggleVisible=()=>{
    const scrolled = document.documentElement.scrollTop;
    if(scrolled > 300){
      setVisible(true)
    }
   else if(scrolled  <= 300){
      setVisible(false)
    }
  }

  const scrollTop =()=>{
    window.scrollTo({
      top:0,
      behavior:"smooth"
    })
  }

  if(typeof window !== "undefined"){
    window.addEventListener("scroll", toggleVisible)
  }


  return (
    <>
    <footer className="pt-5">
      <Container>
        <Row>
          <Col md="3" sm="12" className="quick_link mt-3 mt-md-0 ">
            <h4 className="mt-lg-0 mt-sm-3">公司 </h4>
            <ListGroup variant="flush">
              <ListGroup.Item>
                <NavLink to="/">关于我们</NavLink>
              </ListGroup.Item>
              <ListGroup.Item>
              <NavLink to="/">新闻</NavLink>
              </ListGroup.Item>
              <ListGroup.Item>
              <NavLink to="/">常见问题</NavLink>
              </ListGroup.Item>
             
            </ListGroup>
          </Col>
          <Col md="3" sm="12" className="quick_link mt-3 mt-md-0 ">
          <h4 className="mt-lg-0 mt-sm-3">探索 </h4>
          <ListGroup variant="flush">
              <ListGroup.Item>
                <NavLink to="/"> 常见问题</NavLink>
              </ListGroup.Item>
              <ListGroup.Item>
              <NavLink to="/">旅游列表</NavLink>
              </ListGroup.Item>
              <ListGroup.Item>
              <NavLink to="/"> 目的地</NavLink>
              </ListGroup.Item>
             
            </ListGroup>
          </Col>
          <Col md="3" sm="12" className="quick_link mt-3 mt-md-0 ">
          <h4 className="mt-lg-0 mt-sm-3">快速链接 </h4>
          <ListGroup variant="flush">
              <ListGroup.Item>
                <NavLink to="/"> 首页</NavLink>
              </ListGroup.Item>
              <ListGroup.Item>
              <NavLink to="/">关于我们 </NavLink>
              </ListGroup.Item>
              <ListGroup.Item>
              <NavLink to="/"> 联系我们 </NavLink>
              </ListGroup.Item>
             
            </ListGroup>
          </Col>
          <Col md="3" sm="12" className="location mt-3 mt-md-0 ">
          <h4 className="mt-lg-0 mt-sm-3">联系信息 </h4>

          <div className="d-flex align-items-center">
            <p className="pb-2"> 塔斯马尼亚, 霍巴特, 澳大利亚</p>
          </div>

          <div className="d-flex align-items-top my-2">
          <i className="bi bi-geo-alt me-3"></i>
          <a target="_blank" href="mailto:info@tasmaniaexplore.com" className="d-block" rel="noreferrer" >info@tasmaniaexplore.com</a>
          </div>
          <div className="d-flex align-items-top ">
          <i className="bi bi-telephone me-3"></i>
          <a target="_blank" href="tel:+61398765432" className="d-block" rel="noreferrer" >+61 3 9876 5432</a>
          </div>
         
          </Col>
        </Row>
        <Row className="py-2 bdr mt-3">
        <Col className="col copyright">
        <p className="text-light">   @ 2024. 塔斯马尼亚探索 版权所有 </p> 
        </Col>
        </Row>

      </Container>
    </footer>

    <div id="back-top"
    onClick={scrollTop}
     className={visible ? "active" : ""}>
    <i className="bi bi-arrow-up"></i>

    </div>
    </>
  );
};

export default Footer;

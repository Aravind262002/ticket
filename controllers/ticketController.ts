import { executeQuery } from "../utils/databaseAdapter";

export const createTicket = async (req: any, res: any): Promise<void> => {
  const { title, description, type, venue, status, price, priority, dueDate } =
    req.body;

  try {
    const ticketObj = {
      title,
      description,
      type,
      venue,
      status,
      price,
      priority,
      dueDate,
      created_by: req.user.id,
    };

    const query = `
  INSERT INTO tickets (title, description, type, venue, status, price, priority, "dueDate", created_by, "createdAt", "updatedAt")
  VALUES (:title, :description, :type, :venue, :status, :price, :priority, :dueDate, :created_by, NOW(), NOW())
  RETURNING *; 
`;

    const result = await executeQuery(query, ticketObj);

    if (result && result.length > 0) {
      res.status(201).json(result);
    } else {
      res.status(400).json({ error: "Ticket could not be created." });
    }
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getAllTickets = async (req: any, res: any): Promise<void> => {
  try {
    const query = `
        SELECT * FROM tickets;
      `;

    const results = await executeQuery(query);

    res.status(200).json(results);
  } catch (error: any) {
    res.status(500).json({ error: "An error occured in fetching tickets" });
  }
};

export const assignUserToTicket = async (req: any, res: any): Promise<void> => {
  const { userId } = req.body;
  const ticketId = req.params.ticketId;

  try {
    const ticketQuery = `SELECT * FROM tickets WHERE id = :ticketId`;
    const ticket = await executeQuery(ticketQuery, { ticketId });

    if (!ticket || ticket.length === 0) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const userQuery = `SELECT * FROM users WHERE id = :userId`;
    const user = await executeQuery(userQuery, { userId });

    if (!user || user.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const assignmentQuery = `SELECT * FROM ticket_users WHERE "userId" = :userId AND "ticketId" = :ticketId`;
    const existingAssignment = await executeQuery(assignmentQuery, {
      userId,
      ticketId,
    });

    if (existingAssignment && existingAssignment.length > 0) {
      return res
        .status(400)
        .json({ message: "User already assigned to this ticket" });
    }

    const insertAssignmentQuery = `
     INSERT INTO ticket_users ("userId", "ticketId", "createdAt", "updatedAt") 
      VALUES (:userId, :ticketId, NOW(), NOW())
      RETURNING *; 
      `;

    const insertedTicket = await executeQuery(insertAssignmentQuery, {
      userId,
      ticketId,
    });

    if (insertedTicket && insertedTicket.length > 0) {
      res.status(200).json({ message: "User assigned to ticket successfully" });
    } else {
      res.status(404).json({ message: "Updated ticket not found" });
    }
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "An error occurred while assigning the user" });
  }
};

export const getTicketById = async (req: any, res: any): Promise<void> => {
  const ticketId = req.params.id;

  try {
    const ticketQuery = `
        SELECT t.*, 
         json_agg(json_build_object('userId', u.id, 'name', u.name, 'email', u.email)) AS assignedUsers
        FROM tickets t
        LEFT JOIN ticket_users tu ON t.id = tu."ticketId"  -- Use double quotes for case-sensitive column names
        LEFT JOIN users u ON tu."userId" = u.id  -- Use double quotes for case-sensitive column names
        WHERE t.id = :ticketId
        GROUP BY t.id;
      `;

    const result = await executeQuery(ticketQuery, { ticketId });

    if (result && result.length > 0) {
      const ticketData = result[0];
      res.status(200).json({
        id: ticketData.id,
        title: ticketData.title,
        description: ticketData.description,
        type: ticketData.type,
        venue: ticketData.venue,
        status: ticketData.status,
        price: ticketData.price,
        priority: ticketData.priority,
        dueDate: ticketData.dueDate,
        createdBy: ticketData.created_by,
        assignedUsers: ticketData.assignedusers || [],
        statistics: {
          totalAssigned: ticketData.assignedusers
            ? ticketData.assignedusers.length
            : 0,
          status: ticketData.status,
        },
      });
    } else {
      res.status(404).json({ message: "Ticket not found" });
    }
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "An error occurred while fetching the ticket" });
  }
};

export const getTicketHistory = async (req: any, res: any): Promise<void> => {
  const { startDate, endDate, status, priority, type, venue } = req.query;

  try {
    let statsQuery = `
      SELECT
          COUNT(t.id) OVER() AS totalTickets,
          SUM(CASE WHEN t.status = 'closed' THEN 1 ELSE 0 END) OVER() AS closedTickets,
          SUM(CASE WHEN t.status = 'open' THEN 1 ELSE 0 END) OVER() AS openTickets,
          SUM(CASE WHEN t.status = 'in-progress' THEN 1 ELSE 0 END) OVER() AS inProgressTickets,
          json_build_object(
              'low', SUM(CASE WHEN t.priority = 'low' THEN 1 ELSE 0 END) OVER(),
              'medium', SUM(CASE WHEN t.priority = 'medium' THEN 1 ELSE 0 END) OVER(),
              'high', SUM(CASE WHEN t.priority = 'high' THEN 1 ELSE 0 END) OVER()
          ) AS priorityDistribution,
          json_build_object(
              'concert', SUM(CASE WHEN t.type = 'concert' THEN 1 ELSE 0 END) OVER(),
              'conference', SUM(CASE WHEN t.type = 'conference' THEN 1 ELSE 0 END) OVER(),
              'sports', SUM(CASE WHEN t.type = 'sports' THEN 1 ELSE 0 END) OVER()
          ) AS typeDistribution
      FROM
          tickets t
      WHERE
          1=1
      `;

    let ticketQuery = `
      SELECT
        *
      FROM
        tickets t
      WHERE
        1=1
      `;

    const conditions: string[] = [];
    const replacements: any = {};

    if (startDate) {
      conditions.push(`t."createdAt" >= :startDate`);
      replacements.startDate = new Date(startDate as string);
    }
    if (endDate) {
      conditions.push(`t."createdAt" <= :endDate`);
      replacements.endDate = new Date(endDate as string);
    }
    if (status) {
      conditions.push(`t."status" = :status`);
      replacements.status = status;
    }
    if (priority) {
      conditions.push(`t."priority" = :priority`);
      replacements.priority = priority;
    }
    if (type) {
      conditions.push(`t."type" = :type`);
      replacements.type = type;
    }
    if (venue) {
      conditions.push(`t."venue" = :venue`);
      replacements.venue = venue;
    }

    if (conditions.length > 0) {
      const conditionString = conditions.join(" AND ");
      statsQuery += ` AND ${conditionString}`;
      ticketQuery += ` AND ${conditionString}`;
    }

    const statsResult = await executeQuery(statsQuery, replacements);
    const tickets = await executeQuery(ticketQuery, replacements);

    const stats = statsResult[0];

    res.status(200).json({
      success: true,
      data: {
        totalTickets: stats.totaltickets,
        closedTickets: stats.closedtickets,
        openTickets: stats.opentickets,
        inProgressTickets: stats.inprogresstickets,
        priorityDistribution: stats.prioritydistribution,
        typeDistribution: stats.typedistribution,
        tickets: tickets,
      },
    });
  } catch (error) {
    console.error("Error fetching ticket history:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getTicketAnalytics = async (
  req: any,
  res: any
): Promise<Response> => {
  const { startDate, endDate, status, priority, type, venue } = req.query;

  try {
    const query = `
      WITH ticket_stats AS (
        SELECT
            COUNT(t.id) AS "totalTickets",
            SUM(CASE WHEN t.status = 'closed' THEN 1 ELSE 0 END) AS "closedTickets",
            SUM(CASE WHEN t.status = 'open' THEN 1 ELSE 0 END) AS "openTickets",
            SUM(CASE WHEN t.status = 'in-progress' THEN 1 ELSE 0 END) AS "inProgressTickets",
            json_build_object(
                'low', SUM(CASE WHEN t.priority = 'low' THEN 1 ELSE 0 END),
                'medium', SUM(CASE WHEN t.priority = 'medium' THEN 1 ELSE 0 END),
                'high', SUM(CASE WHEN t.priority = 'high' THEN 1 ELSE 0 END)
            ) AS "priorityDistribution",
            json_build_object(
                'concert', SUM(CASE WHEN t.type = 'concert' THEN 1 ELSE 0 END),
                'conference', SUM(CASE WHEN t.type = 'conference' THEN 1 ELSE 0 END),
                'sports', SUM(CASE WHEN t.type = 'sports' THEN 1 ELSE 0 END)
            ) AS "typeDistribution",
            COALESCE(SUM(t.price), 0) / NULLIF(COUNT(DISTINCT t.created_by), 0) AS "averageCustomerSpending",
            COUNT(t.id) / NULLIF(COUNT(DISTINCT DATE(t."createdAt")), 0) AS "averageTicketsBookedPerDay",
            SUM(CASE WHEN t.priority = 'low' THEN 1 ELSE 0 END) / NULLIF(COUNT(DISTINCT DATE(t."createdAt")), 0) AS "averageLowTicketsBookedPerDay",
            SUM(CASE WHEN t.priority = 'medium' THEN 1 ELSE 0 END) / NULLIF(COUNT(DISTINCT DATE(t."createdAt")), 0) AS "averageMediumTicketsBookedPerDay",
            SUM(CASE WHEN t.priority = 'high' THEN 1 ELSE 0 END) / NULLIF(COUNT(DISTINCT DATE(t."createdAt")), 0) AS "averageHighTicketsBookedPerDay"
        FROM tickets t
        WHERE 1=1
        ${startDate ? `AND t.created_at >= :startDate` : ""}
        ${endDate ? `AND t.created_at <= :endDate` : ""}
        ${status ? `AND t.status = :status` : ""}
        ${priority ? `AND t.priority = :priority` : ""}
        ${type ? `AND t.type = :type` : ""}
        ${venue ? `AND t.venue = :venue` : ""}
    )
    SELECT * FROM ticket_stats;

    `;

    const replacements = {
      startDate: startDate || null,
      endDate: endDate || null,
      status: status || null,
      priority: priority || null,
      type: type || null,
      venue: venue || null,
    };

    const results = await executeQuery(query, replacements);

    return res.json(results[0]);
  } catch (error) {
    return res
      .status(500)
      .json({ error: "An error occurred while fetching ticket analytics." });
  }
};
